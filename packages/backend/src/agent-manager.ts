import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AgentManager {
  private agentProcess: any = null;
  private isReady: boolean = false;
  private pendingCommands: Array<{resolve: Function, reject: Function}> = [];
  private responseBuffer: string = '';

  constructor() {
    this.initializeAgent();
  }

  private initializeAgent() {
    const agentPath = join(__dirname, '../../agent/dist/index.js');
    console.log('Starting agent process from:', agentPath);

    try {
      this.agentProcess = spawn('node', [agentPath], {
        stdio: ['pipe', 'pipe', 'inherit'],
        env: { ...process.env, NODE_AGENT_CLI: 'true' },
        cwd: process.cwd()
      });

      if (!this.agentProcess) {
        console.error('Failed to spawn agent process');
        return;
      }

      console.log('Agent process spawned with PID:', this.agentProcess.pid);
    } catch (error) {
      console.error('Error spawning agent process:', error);
      this.agentProcess = null;
      return;
    }

    if (this.agentProcess.stdout) {
      this.agentProcess.stdout.on('data', (data: Buffer) => {
        const responses = data.toString().split('\n').filter((line: string) => line.trim());

        for (const response of responses) {
          try {
            const parsed = JSON.parse(response);

            if (parsed.ready) {
              this.isReady = true;
              console.log('Agent process is ready');
              continue;
            }

            if (this.pendingCommands.length > 0) {
              const { resolve, reject } = this.pendingCommands.shift()!;
              resolve(parsed);
            }
          } catch (error) {
            console.error('Failed to parse agent response:', response, error);
          }
        }
      });
    }

    if (this.agentProcess.stderr) {
      this.agentProcess.stderr.on('data', (data: Buffer) => {
        console.error('Agent stderr:', data.toString());
      });
    }

    this.agentProcess.on('close', (code: number) => {
      console.log(`Agent process exited with code ${code}`);
      this.isReady = false;

      // Reject all pending commands
      while (this.pendingCommands.length > 0) {
        const { reject } = this.pendingCommands.shift()!;
        reject(new Error('Agent process terminated'));
      }
    });

    this.agentProcess.on('error', (error: Error) => {
      console.error('Agent process error:', error);
      this.isReady = false;
      this.agentProcess = null;
    });
  }

  private async sendCommand(command: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.agentProcess) {
        reject(new Error('Agent process not available'));
        return;
      }

      if (!this.isReady) {
        // Wait a bit for agent to be ready
        setTimeout(() => {
          if (!this.isReady) {
            reject(new Error('Agent process not ready'));
          }
        }, 1000);
        return;
      }

      const timeout = setTimeout(() => {
        const index = this.pendingCommands.findIndex(p => p.resolve === resolve);
        if (index !== -1) {
          this.pendingCommands.splice(index, 1);
        }
        reject(new Error('Agent command timeout'));
      }, 30000); // 30 second timeout

      this.pendingCommands.push({ resolve: (result: any) => {
        clearTimeout(timeout);
        resolve(result);
      }, reject });

      this.agentProcess.stdin.write(JSON.stringify(command) + '\n');
    });
  }

  async executeGraph(graphData: any, message?: string): Promise<any> {
    try {
      const result = await this.sendCommand({
        type: 'execute',
        graphData,
        message
      });
      return result;
    } catch (error) {
      console.error('Failed to execute graph:', error);
      throw error;
    }
  }

  async getStatus(): Promise<any> {
    try {
      return await this.sendCommand({ type: 'status' });
    } catch (error) {
      console.error('Failed to get agent status:', error);
      return { isRunning: false, hasGraph: false };
    }
  }

  async stop(): Promise<void> {
    try {
      await this.sendCommand({ type: 'stop' });
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.sendCommand({ type: 'exit' });
    } catch (error) {
      console.error('Failed to shutdown agent gracefully:', error);
    }

    if (this.agentProcess) {
      this.agentProcess.kill();
      this.agentProcess = null;
    }
  }

  restart(): void {
    if (this.agentProcess) {
      this.agentProcess.kill();
    }
    this.isReady = false;
    this.pendingCommands = [];
    this.initializeAgent();
  }
}

export default AgentManager;