import { Octokit } from "@octokit/rest";

const GITHUB_ORG = process.env.NEXT_PUBLIC_GITHUB_ORG || "kaykumar";
const IDEAS_REPO = process.env.NEXT_PUBLIC_IDEAS_REPO || "withclaude-ideas";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface Idea {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: { name: string; color: string }[];
  user: { login: string; avatar_url: string };
  created_at: string;
  html_url: string;
  comments: number;
}

export async function getIdeas(label?: string): Promise<Idea[]> {
  const params: {
    owner: string;
    repo: string;
    state: "open" | "closed" | "all";
    per_page: number;
    sort: "created" | "updated" | "comments";
    labels?: string;
  } = {
    owner: GITHUB_ORG,
    repo: IDEAS_REPO,
    state: "all",
    per_page: 50,
    sort: "created",
  };

  if (label) {
    params.labels = label;
  }

  const { data } = await octokit.issues.listForRepo(params);

  return data
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || "",
      labels: (issue.labels || [])
        .filter(
          (l): l is { name: string; color: string } =>
            typeof l === "object" && l !== null && "name" in l
        )
        .map((l) => ({ name: l.name || "", color: l.color || "" })),
      user: {
        login: issue.user?.login || "unknown",
        avatar_url: issue.user?.avatar_url || "",
      },
      created_at: issue.created_at,
      html_url: issue.html_url,
      comments: issue.comments,
    }));
}

export async function createIdea(
  title: string,
  body: string,
  category: string,
  username: string
): Promise<string> {
  const fullBody = `${body}\n\n**Category:** ${category}\n**Submitted by:** @${username}`;

  const { data } = await octokit.issues.create({
    owner: GITHUB_ORG,
    repo: IDEAS_REPO,
    title,
    body: fullBody,
    labels: ["idea", "needs-review"],
  });

  return data.html_url;
}

export async function addLabel(
  issueNumber: number,
  label: string
): Promise<void> {
  await octokit.issues.addLabels({
    owner: GITHUB_ORG,
    repo: IDEAS_REPO,
    issue_number: issueNumber,
    labels: [label],
  });
}

export async function removeLabel(
  issueNumber: number,
  label: string
): Promise<void> {
  try {
    await octokit.issues.removeLabel({
      owner: GITHUB_ORG,
      repo: IDEAS_REPO,
      issue_number: issueNumber,
      name: label,
    });
  } catch {
    // Label may not exist, ignore
  }
}

export async function addComment(
  issueNumber: number,
  body: string
): Promise<void> {
  await octokit.issues.createComment({
    owner: GITHUB_ORG,
    repo: IDEAS_REPO,
    issue_number: issueNumber,
    body,
  });
}

export async function getShippedRepos(): Promise<
  { name: string; description: string; html_url: string; stargazers_count: number; created_at: string }[]
> {
  // Get issues with 'shipped' label to find repo names
  const ideas = await getIdeas("shipped");

  // For each shipped idea, try to find the corresponding repo
  const repos = await Promise.all(
    ideas.map(async (idea) => {
      const repoName = idea.title
        .replace(/^\[IDEA\]\s*/i, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      try {
        const { data } = await octokit.repos.get({
          owner: GITHUB_ORG,
          repo: repoName,
        });
        return {
          name: data.name,
          description: data.description || idea.title,
          html_url: data.html_url,
          stargazers_count: data.stargazers_count,
          created_at: data.created_at || idea.created_at,
        };
      } catch {
        return {
          name: repoName,
          description: idea.title,
          html_url: `https://github.com/${GITHUB_ORG}/${repoName}`,
          stargazers_count: 0,
          created_at: idea.created_at,
        };
      }
    })
  );

  return repos;
}
