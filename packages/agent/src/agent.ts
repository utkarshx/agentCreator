import { spawn } from 'child_process';
import { LGraph, LiteGraph } from '@comfyorg/litegraph';
import { registerBackendNodes } from './nodes/index.js';

class AgentExecutor {
  private graph: any = null;
  private isRunning: boolean = false;

  constructor() {
    this.graph = null;
    this.isRunning = false;
  }

  // Initialize the agent with nodes
  initialize() {
    // Register backend execution nodes
    registerBackendNodes();
  }

  // Configure and execute a graph
  async executeGraph(graphData, message = null) {
    try {
      // console.log('Agent: Starting graph execution');
      this.isRunning = true;

      // Store message in execution context for AI agent nodes
      if (message) {
        global.executionContext = {
          message: message,
          timestamp: new Date().toISOString()
        };
      }

      // Create a new graph
      this.graph = new LGraph();

      // Configure the graph from the frontend data
      this.graph.configure(graphData);

      // Execute the graph
      this.graph.runStep(1, true);

      // Collect outputs from AgentRun nodes and other output nodes
      const outputs = {};

      // Collect from SumNode (existing logic)
      try {
        const { SumNode } = await import('./nodes/SumNode.js');
        this.graph.findNodesByClass(SumNode).forEach((node, index) => {
          outputs[`output_${index}`] = node.outputs[0]?._data || node.outputs[0]?.data;
        });
      } catch (error) {
        console.log('No SumNode found or error importing SumNode:', error.message);
      }

      // Collect from AgentRunNode (AI agent results)
      try {
        const { AgentRunNode } = await import('./nodes/AgentRunNode.js');
        const agentRunNodes = this.graph.findNodesByClass(AgentRunNode);
        agentRunNodes.forEach((node, index) => {
          const result = node.outputs[0]?._data || node.outputs[0]?.data;
          if (result) {
            outputs[`agent_result_${index}`] = result;
            outputs[`agent_message_${index}`] = result.message || '';
            outputs[`agent_success_${index}`] = result.success || false;
            outputs[`agent_error_${index}`] = result.error || '';
            outputs[`agent_execution_time_${index}`] = node.outputs[4]?._data || node.outputs[4]?.data || 0;
          }
        });
      } catch (error) {
        console.log('No AgentRunNode found or error importing AgentRunNode:', error.message);
      }

      this.isRunning = false;
      // console.log('Agent: Graph execution completed');

      return {
        success: true,
        outputs,
        message: 'Graph executed successfully'
      };

    } catch (error) {
      this.isRunning = false;
      console.error('Agent: Error executing graph:', error);
      return {
        success: false,
        error: error.message,
        message: 'Graph execution failed'
      };
    }
  }

  // Get agent status
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasGraph: !!this.graph
    };
  }

  // Stop current execution
  stop() {
    if (this.graph) {
      this.graph.stop();
    }
    this.isRunning = false;
    // console.log('Agent: Execution stopped');
  }
}

// CLI interface for standalone agent execution
if (import.meta.url === `file://${process.argv[1]}` || process.env.NODE_AGENT_CLI) {
  const agent = new AgentExecutor();
  agent.initialize();

  // Listen for commands from stdin
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (data) => {
    try {
      const command = JSON.parse(data.toString().trim());

      switch (command.type) {
        case 'execute':
          const result = await agent.executeGraph(command.graphData, command.message);
          process.stdout.write(JSON.stringify(result) + '\n');
          break;

        case 'status':
          const status = agent.getStatus();
          process.stdout.write(JSON.stringify(status) + '\n');
          break;

        case 'stop':
          agent.stop();
          process.stdout.write(JSON.stringify({ success: true, message: 'Agent stopped' }) + '\n');
          break;

        case 'exit':
          agent.stop();
          process.exit(0);
          break;

        default:
          process.stdout.write(JSON.stringify({ success: false, error: 'Unknown command' }) + '\n');
      }
    } catch (error) {
      process.stdout.write(JSON.stringify({ success: false, error: error.message }) + '\n');
    }
  });

  // Signal that agent is ready
  process.stdout.write(JSON.stringify({ ready: true }) + '\n');
}

export default AgentExecutor;