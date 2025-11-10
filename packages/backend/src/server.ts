import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { LGraph, LiteGraph } from '@comfyorg/litegraph';
import { registerBackendNodes } from './nodes/index.js';

// Initialize Express app
const app = express();
const PORT = process?.env?.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for graphs (in a real app, use a database)
// This is currently unused but kept for future implementation
const _GRAPHS = new Map();

// Initialize codebolt connection globally
let codebolt: any = null;

// Initialize codebolt connection
async function initializeCodebolt() {
  if (!codebolt) {
    try {
      codebolt = require('@codebolt/codeboltjs');
      console.log('Codebolt connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Codebolt connection:', error);
      throw error;
    }
  }
  return codebolt;
}

// API endpoint to execute a graph
app.post('/api/execute', async (req, res) => {
  try {
    const { graphData, message } = req.body;

    if (!graphData) {
      return res.status(400).json({ error: 'Graph data is required' });
    }

    // Initialize codebolt connection
    await initializeCodebolt();

    // Store message in execution context for AI agent nodes
    if (message) {
      global.executionContext = {
        message: message,
        timestamp: new Date().toISOString()
      };
    }

    // Create a new graph
    const graph = new LGraph();

    // Register backend execution nodes (using shared base classes)
    registerBackendNodes();

    // Configure the graph from the frontend data
    graph.configure(graphData);

    // Execute the graph
    graph.runStep(1, true);

    // Collect outputs from AgentRun nodes and other output nodes
    const outputs = {};

    // Collect from SumNode (existing logic)
    try {
      const { SumNode } = await import('./nodes/SumNode.js');
      graph.findNodesByClass(SumNode).forEach((node, index) => {
        outputs[`output_${index}`] = (node.outputs[0] as any)?._data || (node.outputs[0] as any)?.data;
      });
    } catch (error) {
      console.log('No SumNode found or error importing SumNode:', error.message);
    }

    // Collect from AgentRunNode (AI agent results)
    try {
      const { AgentRunNode } = await import('./nodes/AgentRunNode.js');
      const agentRunNodes = graph.findNodesByClass(AgentRunNode);
      agentRunNodes.forEach((node, index) => {
        const result = (node.outputs[0] as any)?._data || (node.outputs[0] as any)?.data;
        if (result) {
          outputs[`agent_result_${index}`] = result;
          outputs[`agent_message_${index}`] = result.message || '';
          outputs[`agent_success_${index}`] = result.success || false;
          outputs[`agent_error_${index}`] = result.error || '';
          outputs[`agent_execution_time_${index}`] = (node.outputs[4] as any)?._data || (node.outputs[4] as any)?.data || 0;
        }
      });
    } catch (error) {
      console.log('No AgentRunNode found or error importing AgentRunNode:', error.message);
    }

    res.json({
      success: true,
      outputs,
      message: 'Graph executed successfully'
    });

  } catch (error) {
    console.error('Error executing graph:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ES modules are used, no need for module.exports