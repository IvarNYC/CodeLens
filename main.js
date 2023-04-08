function parseRepositoryUrl(url) {
  const regex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)/;
  const match = url.match(regex);

  if (match) {
    return {
      owner: match[1],
      repo: match[2],
    };
  }

  return null;
}

async function getRepositoryData() {
  console.log("getRepositoryData called");
  const repositoryUrl = document.getElementById("repositoryUrl").value;
  console.log("URL:", repositoryUrl);
  const parsedUrl = parseRepositoryUrl(repositoryUrl);
  console.log("Parsed URL:", parsedUrl);

  if (parsedUrl) {
    const { owner, repo } = parsedUrl;
    const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const readmeApiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
    const contentsApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

    try {
      const [repoResponse, readmeResponse, contentsResponse] =
        await Promise.all([
          fetch(repoApiUrl),
          fetch(readmeApiUrl),
          fetch(contentsApiUrl),
        ]);

      if (repoResponse.ok && readmeResponse.ok && contentsResponse.ok) {
        const repositoryData = await repoResponse.json();
        const readmeData = await readmeResponse.json();
        const contentsData = await contentsResponse.json();

        const summary = generateSummary(repositoryData);
        displaySummary(summary);

        const readmeHtml = generateReadme(readmeData);
        displayReadme(readmeHtml);

        const fileStructure = generateFileStructure(contentsData);
        displayFileStructure(fileStructure);
      } else {
        console.error(
          `Error fetching repository data: ${repoResponse.statusText}, ${readmeResponse.statusText}, ${contentsResponse.statusText}`
        );
      }
    } catch (error) {
      console.error(`Error fetching repository data: ${error}`);
    }
  } else {
    console.error("Invalid GitHub repository URL.");
  }
}

function generateReadme(readmeData) {
  const readmeBase64 = readmeData.content;
  const readmeDecoded = atob(readmeBase64);

  if (typeof marked === "function") {
    const readmeHtml = marked(readmeDecoded);
    return readmeHtml;
  } else {
    return `<pre>${readmeDecoded}</pre>`;
  }
}

function displayReadme(readmeHtml) {
  const readmeContainer = document.createElement("div");
  readmeContainer.innerHTML = `<h2>README</h2><pre>${readmeHtml}</pre>`;
  document.getElementById("summaryContainer").appendChild(readmeContainer);
}

function generateFileStructure(contentsData) {
  const fileStructure = contentsData.map((item) => {
    return {
      name: item.name,
      path: item.path,
      type: item.type,
    };
  });

  return fileStructure;
}

function displayFileStructure(fileStructure) {
  const fileStructureContainer = document.createElement("div");
  fileStructureContainer.innerHTML = `<h2>File Structure</h2><pre>${JSON.stringify(
    fileStructure,
    null,
    2
  )}</pre>`;
  document
    .getElementById("summaryContainer")
    .appendChild(fileStructureContainer);
}
function generateSummary(repositoryData) {
  const {
    name,
    description,
    html_url,
    forks_count,
    stargazers_count,
    open_issues_count,
    watchers_count,
    language,
  } = repositoryData;

  const summary = {
    name,
    description,
    url: html_url,
    forks: forks_count,
    stars: stargazers_count,
    issues: open_issues_count,
    watchers: watchers_count,
    language,
  };

  return summary;
}

function displaySummary(summary) {
  const summaryContainer = document.getElementById("summaryContainer");

  const summaryHtml = `
      <h3><a href="${summary.url}" target="_blank">${summary.name}</a></h3>
      <p>${summary.description}</p>
      <ul>
        <li>Forks: ${summary.forks}</li>
        <li>Stars: ${summary.stars}</li>
        <li>Open Issues: ${summary.issues}</li>
        <li>Watchers: ${summary.watchers}</li>
        <li>Main Language: ${summary.language || "Unknown"}</li>
      </ul>
    `;

  summaryContainer.innerHTML = summaryHtml;
}

document
  .getElementById("submitBtn")
  .addEventListener("click", getRepositoryData);
