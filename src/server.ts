import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import "dotenv/config";


const API_KEY = process.env.GITHUB_TOKEN;
const server = new McpServer({
    name:"github-assistant",
    version:'1.0.0',
})

server.registerTool(
    "getMyTodayCommits",
    {
      description: "Get the number of GitHub commits I made today",
    },
    async () => {

        const response = await fetch(
            "https://api.github.com/user/repos?per_page=100",
            {
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                Accept: "application/vnd.github+json",
              },
            }
          );
        
          const repos = await response.json();
        
          let totalCommits = 0;
        
          const repositories: Record<string, number> = {};
        
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
        
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
        
          for (const repo of repos) {
            const commitsResponse = await fetch(
              `https://api.github.com/repos/JokkimDoras/${repo.name}/commits?author=JokkimDoras&since=${startOfToday.toISOString()}&until=${endOfToday.toISOString()}`,
              {
                headers: {
                  Authorization: `Bearer ${API_KEY}`,
                  Accept: "application/vnd.github+json",
                },
              }
            );
        
            const commits = await commitsResponse.json();
        
            if (commits.length > 0) {
              repositories[repo.name] = commits.length;
              totalCommits += commits.length;
            }
          }
        
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  totalCommits,
                  repositories
                })
              }
            ]
          };
      
    }
  );

  console.error("GitHub MCP SERVER STARTED");

const transport = new StdioServerTransport();

await server.connect(transport)


