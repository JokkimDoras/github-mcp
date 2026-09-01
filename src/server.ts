import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import "dotenv/config";

interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  user: {
    login: string;
  };
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
  draft: boolean;
}

const API_KEY = process.env.GITHUB_TOKEN;
const server = new McpServer({
    name:"github-assistant",
    version:'1.0.0',
})

const getUserName = async() => {
  const userResponse = await fetch(
    "https://api.github.com/user",
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const user = await userResponse.json();
      
      const username = user.login;

      return username
  
}

const getUserRepos = async() => {
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
  return repos
}

server.registerTool(
    "getMyTodayCommits",
    {
      description: "Get the number of GitHub commits I made today",
    },
    async () => {

      
        const userName = await getUserName();
        
        const repos = await getUserRepos();
        
          let totalCommits = 0;
        
          const repositories: Record<string, number> = {};
        
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
        
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
        
          for (const repo of repos) {
           
            const commitsResponse = await fetch(
              `https://api.github.com/repos/${userName}/${repo.name}/commits?author=${userName}&since=${startOfToday.toISOString()}&until=${endOfToday.toISOString()}`,
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

  server.registerTool(
    'getMyOpenPRs',
    {
      description:'Get My Open Pull Requests'
    },
    async () => {
      const prs = await getPullRequestTest();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(prs),
        },
      ],
    };
  }
  )

  console.error("GitHub MCP SERVER STARTED");



const transport = new StdioServerTransport();

await server.connect(transport)


async function getPullRequestTest() {
  const userName = await getUserName();
  const repos = await getUserRepos();
  const allPRs: PullRequest[] = [];

  for (const repo of repos) {
    const response = await fetch(
      `https://api.github.com/repos/${userName}/${repo.name}/pulls?state=open`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!response.ok) {
      console.log(`Failed: ${repo.name} - ${response.status}`);
      continue;
    }

    const prs:PullRequest[] = await response.json();

    for (const pr of prs) {
      allPRs.push({
        repo: repo.name,
        number: pr.number,
        title: pr.title,
        body: pr.body,
        author: pr.user.login,
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref,
        draft: pr.draft,
      });

    }
  }
  return allPRs
}








//////////////////////////////////////////////////////////////////

// TEST CODE

// async function test () {

//   const userName = await getUserName();
        
//   const repos = await getUserRepos();
    
//       let totalCommits = 0;
    
//       const repositories: Record<string, number> = {};
    
//       const startOfToday = new Date();
//       startOfToday.setHours(0, 0, 0, 0);
    
//       const endOfToday = new Date();
//       endOfToday.setHours(23, 59, 59, 999);
    
//       for (const repo of repos) {
       
//         const commitsResponse = await fetch(
//           `https://api.github.com/repos/${userName}/${repo.name}/commits?author=${userName}&since=${startOfToday.toISOString()}&until=${endOfToday.toISOString()}`,
//           {
//             headers: {
//               Authorization: `Bearer ${API_KEY}`,
//               Accept: "application/vnd.github+json",
//             },
//           }
//         );
    
//         const commits = await commitsResponse.json();
          
//         if (commits.length > 0) {
//           repositories[repo.name] = commits.length;
//           totalCommits += commits.length;
//         }
//         // console.log(repo.name,commits.length)
//       }

    
//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify({
//               totalCommits,
//               repositories
//             })
//           }
//         ]
//       };
  
// }
// const final =await test();
// console.log(final)



// getPullRequestTest();