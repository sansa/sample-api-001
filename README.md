# VerdeFlow — Introduction

## 1. What is VerdeFlow?

VerdeFlow is a **commit-aware, workload-driven energy profiling platform for APIs**.

Its goal is to give developers, DevOps engineers, and engineering managers **actionable insights** into:

- How API endpoints behave under load  
- How resource usage (CPU, memory, network) changes across commits  
- How performance optimizations influence energy consumption  
- Which parts of the API are “guzzlers” and where improvements matter most  

VerdeFlow integrates directly into the development process, letting teams:

- Profile API endpoints on real hardware (e.g., Raspberry Pi agents)  
- Use OpenAPI specs to define or auto-generate workloads  
- Run **differential measurements** across commits or scenarios  
- Attribute energy consumption per endpoint, scenario, or commit  
- Compare optimizations like caching, compression, batching, and refactoring  

---

## 2. How VerdeFlow Works (Conceptual Overview)

At a high level:

1. A developer pushes code or manually triggers a profiling run.  
2. VerdeFlow builds and/or deploys the target API (or uses an existing instance).  
3. A **Profiling Agent** (usually a Raspberry Pi or Linux host) runs predefined workloads against that API.  
4. The Agent:
   - Executes HTTP calls against the target API  
   - Collects timing, CPU, memory, and network metrics  
   - Streams metrics to the VerdeFlow backend ingest service  
5. The backend **Estimator**:
   - Integrates power to energy  
   - Attributes energy usage per endpoint/scenario/commit  
   - Calculates optional carbon metrics  
6. The **UI** visualizes:
   - Trends per commit  
   - Scenario comparisons (baseline vs cached vs compressed vs refactored)  
   - Bottleneck endpoints and potential “energy guzzlers”  

---

## 3. System Architecture (Developer-Friendly Summary)

VerdeFlow is implemented as a modular TypeScript monorepo for the backend, plus separate repositories for the UI, agent, and sample API.

### 3.1 Core Components

- **VerdeFlow API (Control Plane)**  
  Orchestrates projects, devices, reservations, runs, metrics ingest, and energy estimation. It exposes public APIs for the UI, CLI, and CI integrations, and private RPC endpoints for profiling agents.

- **VerdeFlow UI**  
  A web dashboard used to manage projects, define workloads, trigger runs, and inspect results.

- **VerdeFlow Agents (Runners)**  
  Device-side processes (often on Raspberry Pis) that execute workloads, collect metrics, and send them back to the backend.

- **Sample API**  
  A demonstration API with multiple implementation variants (baseline, cached, compressed, refactored, heavy load), designed to showcase VerdeFlow’s capabilities.

- **Storage (PostgreSQL + Time Series DB + Object Storage)**  
  Stores configuration, runs, reservations, raw metrics, and aggregated results.

### 3.2 Backend Monorepo Structure (Summary)

The `verde-flow-api` repository is a pnpm monorepo with apps and shared packages, for example:

- `apps/gateway` – Public HTTP/GraphQL API surface  
- `apps/ingest` – Metrics and workload timeline ingest  
- `apps/estimator` – Energy and carbon computation  
- `apps/scheduler` – Reservations, queueing, and lifecycle orchestration  
- `packages/*` – Domain, storage, workloads, metrics schema, policies, telemetry, configuration, and more  

This separation provides:

- Clear boundaries between responsibilities  
- Reusable and testable shared libraries  
- Scalable service orchestration and CI/CD  


---

# VerdeFlow — Setup Guide

This guide explains how to set up a local VerdeFlow environment including the backend API, UI, profiling agent, and sample API.

---

## 1. Prerequisites

### 1.1 Tools

Install the following on your development machine:

- **Docker & Docker Compose**  
- **Node.js** (LTS version recommended)  
- **pnpm** (preferred package manager for the monorepo)  
- **Git**  
- **PostgreSQL client** (optional, useful for debugging the DB)  

### 1.2 Hardware

For realistic profiling, you typically use a **Raspberry Pi** (e.g., Raspberry Pi 4).  
However, any Linux machine can act as a profiling agent as long as it has network access to the backend API and the target API.

---

## 2. Clone Repositories

Clone the required repositories. Adjust URLs to your actual Git server.

```bash
git clone <repo-url>/verde-flow-api.git
git clone <repo-url>/verde-flow-ui.git
git clone <repo-url>/verde-flow-pi-agent.git
git clone <repo-url>/sample-api.git
```

You should now have four sibling folders:

- `verde-flow-api/`  
- `verde-flow-ui/`  
- `verde-flow-pi-agent/`  
- `sample-api/`  

---

## 3. Backend (API) Setup

### 3.1 Install Dependencies

```bash
cd verde-flow-api
pnpm install
```

### 3.2 Environment Configuration

Copy the example environment file and adjust values:

```bash
cp .env.example .env
```

Typical settings include:

- `POSTGRES_URL` – PostgreSQL connection string  
- `TSDB_URL` – Time series database endpoint (e.g., VictoriaMetrics)  
- `S3_ENDPOINT` and `S3_BUCKET` – Object storage for artifacts  
- `TIMEZONE_DEFAULT` – Default timezone (e.g., `Europe/Helsinki`)  

### 3.3 Database Migrations & Seed Data

Run migrations and seed the database:

```bash
pnpm migrate
pnpm seed
```

### 3.4 Start Backend Services

To start all backend apps in development mode:

```bash
pnpm dev
```

This typically launches:

- Gateway API  
- Ingest service  
- Estimator service  
- Scheduler service  

You can also run individual apps via `pnpm --filter`, depending on how the repo is configured.

---

## 4. UI Setup

### 4.1 Install Dependencies

```bash
cd ../verde-flow-ui
pnpm install
```

### 4.2 Configure Environment

Copy and edit the `.env` file if necessary (e.g., API base URL):

```bash
cp .env.example .env
# Set VITE_API_BASE_URL or equivalent to point at the gateway API
```

### 4.3 Start the UI

```bash
pnpm dev
```

Open your browser at the URL shown in the terminal, e.g.:

- `http://localhost:5173`

You should see the VerdeFlow web interface.

---

## 5. Profiling Agent Setup (Raspberry Pi or Linux Host)

### 5.1 Prepare the Host

On the agent device:

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose
sudo usermod -aG docker $USER
```

Log out and back in to ensure your user is added to the `docker` group.

### 5.2 Clone and Configure the Agent

```bash
git clone <repo-url>/verde-flow-pi-agent.git
cd verde-flow-pi-agent
pnpm install
cp .env.example .env
```

Update `.env` with:

- `VERDEFLOW_API_URL` – URL of the backend gateway, e.g. `http://<host>:<port>`  
- `TARGET_API_BASE_URL` – Base URL of the API to be profiled (e.g., sample API)  

### 5.3 Start the Agent

```bash
pnpm start
```

The agent should:

- Register itself with the backend (if applicable)  
- Be ready to accept profiling jobs or manual commands  

---

## 6. Sample API Setup

The Sample API provides a hands-on playground to understand VerdeFlow.

```bash
cd ../sample-api
pnpm install
pnpm dev
```

Make note of the port it runs on, e.g. `http://localhost:3000`, and ensure the profiling agent can reach it (you may need to use `host.docker.internal` or the host IP address when running Docker).

You are now ready to connect everything through the VerdeFlow UI and run your first profiling session.


---

# VerdeFlow — Sample API Guide

The Sample API is a demonstration service designed to help you quickly learn how VerdeFlow works in practice.

It provides multiple implementation variants so you can see how design decisions affect:

- Response time  
- Resource usage (CPU, memory, network)  
- Energy consumption per request or scenario  

---

## 1. Sample API Scenarios

Typical scenarios (your actual API may expose slightly different routes/names):

- **Baseline**  
  Straightforward implementation, no special optimizations.

- **Cache**  
  Uses in-memory or external caching to reduce repeated work.

- **Compression**  
  Compresses responses (e.g., GZIP) to reduce network usage, often at the cost of additional CPU.

- **Refactored**  
  More efficient algorithms or data structures, resulting in lower CPU and faster responses.

- **Heavy / Stress Endpoints**  
  Deliberately expensive endpoints to highlight bottlenecks and “guzzlers”.

These variants can be implemented as separate routes or as query parameters that switch behavior.

---

## 2. Running the Sample API

From the repository:

```bash
cd sample-api
pnpm install
pnpm dev
```

Check which port the API is running on (for example, `http://localhost:3000`).  
Ensure that the **profiling agent** can reach this URL. With Docker in the mix, you might need to use:

- `http://host.docker.internal:3000` (on some platforms), or  
- The host machine’s IP address.

You’ll use this URL later as the **Target API Base URL** in VerdeFlow.

---

## 3. Creating a Project for the Sample API

In the **VerdeFlow UI**:

1. Go to **Projects → New Project**.  
2. Fill in fields such as:
   - **Name**: `Sample API – Energy Demo`  
   - **Repository URL**: `<URL of sample-api repo>`  
   - **Default Branch**: `main` (or your default)  
   - **Target Base URL**: the URL at which the sample API is reachable from the agent (e.g., `http://host.docker.internal:3000`).  
3. Save the project.

This config allows VerdeFlow to associate profiling runs with the sample API and its commits.

---

## 4. Running a Profiling Session

You can start profiling via the UI or CI. For a first test, use the UI.

### 4.1 Manual Run from the UI

1. Open the **Sample API project** you created.  
2. Click **“Run Profiling”** or the equivalent action.  
3. Choose:
   - A **Scenario** such as `baseline`, `cache`, `compression`, or `refactored`.  
   - A **Workload** (for example, “100 requests over 60 seconds”).  
4. Confirm and start the run.

The backend scheduler assigns the run to an available agent, which then:

- Executes the workload against the sample API  
- Collects metrics  
- Streams them to the ingest service  

### 4.2 CI-Triggered Runs (Optional)

You can also configure CI pipelines or Git webhooks to automatically trigger runs whenever:

- A new commit is pushed  
- A pull request is opened or updated  

This allows you to treat energy metrics similarly to tests or quality checks.

---

## 5. Interpreting Results for the Sample API

Once a run finishes, open the project in the UI and explore:

### 5.1 Metrics Over Time

Common charts include:

- CPU usage vs time  
- Memory usage vs time  
- Network throughput vs time  
- Response times (min/avg/max or histograms)  
- Estimated power and energy consumption  

### 5.2 Scenario Comparisons

Use the comparison views to answer questions such as:

- Did **caching** reduce CPU, latency, and energy usage?  
- Did **compression** reduce network traffic but increase CPU time?  
- Did **refactoring** significantly lower response times and total energy per request?  
- Are there endpoints that dominate energy usage even with optimizations?  

### 5.3 Commit and Branch Trends

For commit-aware configurations, you can:

- Compare energy metrics across commits or branches  
- Spot regressions early  
- Justify refactoring work with quantified improvements  

The Sample API is deliberately small and safe to experiment with. Use it to build intuition before applying VerdeFlow to production services.


---

# VerdeFlow — Developer Workflows & Best Practices

This guide focuses on how developers use VerdeFlow day-to-day, including typical workflows, best practices, and useful commands.

---

## 1. Typical Developer Workflows

### 1.1 After Implementing a Feature or Optimization

1. Implement your code change in the API.  
2. Push to the repository or open a pull request.  
3. Trigger a profiling run (manually or via CI).  
4. In the VerdeFlow UI, compare:
   - The new commit vs the previous commit  
   - Resource usage (CPU, memory, network)  
   - Response times  
   - Energy consumption per endpoint or scenario  

Use these insights to confirm whether the change is actually beneficial from both performance and energy perspectives.

---

### 1.2 Before Merging a Pull Request

Treat energy profiling as part of your quality gate:

1. Ensure at least one profiling run is associated with the PR’s latest commit.  
2. Review dashboards for:
   - Energy regressions (marked or highlighted where supported)  
   - Significant latency increases  
   - Memory or CPU spikes  
3. If regressions are unacceptable, iterate on the implementation before merging.

---

### 1.3 When Refactoring or Simplifying Logic

Refactoring often aims to make code cleaner or faster. VerdeFlow lets you:

1. Run profiling on the **pre-refactor** commit.  
2. Run profiling again on the **post-refactor** commit.  
3. Compare metrics side-by-side to quantify improvements or regressions.  

You can answer questions like:

- Did refactoring reduce CPU time?  
- Are expensive calls invoked less often?  
- Is energy per request now lower?  

---

### 1.4 Investigating a “Guzzler” Endpoint

When an endpoint appears suspicious (slow, heavy, or frequently used):

1. Design focused workloads hitting only that endpoint (or a small subset).  
2. Run profiling sessions with different scenarios, for example:
   - Current implementation  
   - Version with caching  
   - Version with batching or streaming  
3. Compare:
   - Response time distributions  
   - CPU and memory usage  
   - Energy per request  

Use these insights to prioritize optimizations that offer the best trade-offs.

---

## 2. Best Practices

- **Use deterministic workloads**  
  Ensure your workloads are repeatable and not heavily influenced by external randomness or unstable dependencies.

- **Stabilize the environment**  
  Run profiling on relatively idle machines or dedicated profiling devices to reduce noise from other processes.

- **Use OpenAPI-based scenarios where possible**  
  Generating workloads from an OpenAPI spec helps keep scenarios aligned with the live API surface.

- **Measure before and after**  
  Always take a baseline measurement before making changes; this makes it easier to highlight improvements or regressions.

- **Think in trade-offs**  
  Some optimizations may reduce energy at the cost of higher latency or vice versa. Use VerdeFlow to make informed decisions.

- **Automate in CI**  
  Integrate profiling into CI so energy regressions are detected early, ideally before code is merged into main branches.

---

## 3. Quick Reference Commands

These examples assume standard scripts; adjust to your actual repo scripts as needed.

### 3.1 Backend

```bash
# Install dependencies
cd verde-flow-api
pnpm install

# Run database migrations and seed data
pnpm migrate
pnpm seed

# Start all backend applications
pnpm dev

# Run tests and type checks
pnpm test
pnpm lint
pnpm typecheck
```

### 3.2 UI

```bash
cd ../verde-flow-ui
pnpm install
pnpm dev
```

### 3.3 Profiling Agent

```bash
cd ../verde-flow-pi-agent
pnpm install
pnpm start
```

### 3.4 Sample API

```bash
cd ../sample-api
pnpm install
pnpm dev
```

---

## 4. Extending VerdeFlow

As VerdeFlow evolves, you can extend it with:

- **New collectors** (e.g., different power measurement tools or hardware)  
- **New workload types** (e.g., asynchronous patterns, batch jobs)  
- **Additional dashboards and reports** tailored to your domain  
- **PR annotations and status checks** in your Git hosting platform  

Always update the documentation and onboarding material when new capabilities are added so that developers can discover and use them effectively.


---

