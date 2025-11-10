import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AgentManager {
  private agentProcess: any = null;
  private dataDir: string;

  constructor() {
    this.dataDir = join(__dirname, '../../data');
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    try {
      mkdirSync(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async executeAgentWithGraphData(graphData: any, message?: string): Promise<any> {
    try {
      // Write graph data and message to data.json file before starting agent
      const dataFilePath = join(this.dataDir, 'data.json');
      const dataToWrite = {
        graphData,
        message
      };

      writeFileSync(dataFilePath, JSON.stringify(dataToWrite, null, 2));
      console.log('Graph data written to:', dataFilePath);

      // Start the agent process
      const agentPath = join(__dirname, '../../agent/dist/index.js');
      console.log('Starting agent process from:', agentPath);

      return new Promise((resolve, reject) => {
        const agentProcess = spawn('node', [agentPath], {
          stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, stdout and stderr as pipes
          env: { ...process.env, NODE_AGENT_CLI: 'true' },
          cwd: process.cwd()
        });

        if (!agentProcess) {
          reject(new Error('Failed to spawn agent process'));
          return;
        }

        console.log('Agent process spawned with PID:', agentProcess.pid);

        let agentReady = false;
        let responseBuffer = '';

        // Handle stdout from agent
        if (agentProcess.stdout) {
          agentProcess.stdout.on('data', (data: Buffer) => {
            const responses = data.toString().split('\n').filter((line: string) => line.trim());

            for (const response of responses) {
              try {
                const parsed = JSON.parse(response);

                if (parsed.ready) {
                  agentReady = true;
                  console.log('Agent process is ready - auto-executing');
                  // Agent will auto-execute, no need to send commands
                  continue;
                }

                // This is the execution result
                resolve(parsed);
                agentProcess.kill();
              } catch (error) {
                // Ignore non-JSON responses during initialization
                if (!response.includes('Agent initialized')) {
                  console.error('Failed to parse agent response:', response);
                }
              }
            }
          });
        }

        // Handle stderr from agent
        if (agentProcess.stderr) {
          agentProcess.stderr.on('data', (data: Buffer) => {
            console.error('Agent stderr:', data.toString());
          });
        }

        // Handle agent process completion
        agentProcess.on('close', (code: number) => {
          console.log(`Agent process exited with code ${code}`);

          if (!agentReady && code !== 0) {
            reject(new Error('Agent process failed to start or exited with error'));
          }
        });

        // Handle agent process errors
        agentProcess.on('error', (error: Error) => {
          console.error('Agent process error:', error);
          reject(error);
        });

        // Set a timeout for the entire operation
        const timeout = setTimeout(() => {
          agentProcess.kill();
          reject(new Error('Agent execution timeout'));
        }, 60000); // 60 second timeout

        // Clear timeout when promise resolves
        Promise.resolve().then(() => clearTimeout(timeout));
      });

    } catch (error) {
      console.error('Failed to execute graph:', error);
      throw error;
    }
  }

  async executeGraph(graphData: any, message?: string): Promise<any> {
    try {
      const result = await this.executeAgentWithGraphData(graphData, message);
      return result;
    } catch (error) {
      console.error('Failed to execute graph:', error);
      throw error;
    }
  }

  async getStatus(): Promise<any> {
    // Since we're not keeping a persistent agent, just return basic status
    return {
      isRunning: false,
      hasGraph: false,
      mode: 'on-demand'
    };
  }

  async stop(): Promise<void> {
    // No persistent agent to stop
    console.log('No persistent agent to stop');
  }

  async shutdown(): Promise<void> {
    // No persistent agent to shutdown
    console.log('No persistent agent to shutdown');
  }

  restart(): void {
    // No persistent agent to restart
    console.log('No persistent agent to restart');
  }
}

export default AgentManager;