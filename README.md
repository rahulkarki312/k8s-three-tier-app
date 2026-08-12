


A production-grade, cloud-native 3-tier web application deployed on a Linux VPS using K3s Kubernetes, featuring automated CI/CD with Jenkins and ArgoCD GitOps.

## Technology Stack

| Layer             | Technology                       | Purpose                                    |
| ----------------- | -------------------------------- | ------------------------------------------ |
| **Runtime**       | Node.js 18, Express.js           | Application server                         |
| **Database**      | PostgreSQL 17.5                  | Persistent data storage                    |
| **Container**     | Docker, Podman                   | OCI-compatible images                      |
| **Orchestration** | K3s Kubernetes                   | Container orchestration                    |
| **Ingress**       | Traefik                          | Routing, rate limiting                     |
| **GitOps**        | ArgoCD                           | Automated Git-to-cluster synchronization   |
| **CI**            | Jenkins                          | Build, test, push, manifest updates        |
| **Security**      | NetworkPolicies, SecurityContext | Zero-trust networking, non-root containers |
| **Storage**       | PersistentVolumeClaim            | Database persistence                       |
| **Config**        | Kustomize                        | Environment-specific overlays              |
| **OS**            | AlmaLinux 9.7                    | Host operating system                      |

##  Features

### 1. GitOps Deployment with ArgoCD

ArgoCD continuously monitors the Git repository and automatically synchronizes the cluster state to match the desired state defined in Git. Any manual changes to the cluster are auto-reverted (self-healing). Deployment is fully declarative with zero manual kubectl commands in production.

### 2. Zero-Trust Network Security

Default-deny NetworkPolicies enforce strict traffic control between all tiers. The frontend can only reach the backend on port 3000. The backend can only reach PostgreSQL on port 5432. PostgreSQL cannot initiate any outbound connections. Even if one tier is compromised, lateral movement is blocked.

### 3. Container Security Hardening

All containers run as non-root users with dropped Linux capabilities. Privilege escalation is disabled. Security contexts enforce read-only root filesystems where possible. No container can gain root access even if the application is exploited.

### 4. Automated Canary-Ready CI Pipeline

Jenkins builds both services in parallel, tags images with immutable build numbers for rollbacks, automatically updates Kubernetes manifests in Git, and pushes changes back to trigger ArgoCD deployment. The `[skip ci]` commit tag prevents recursive builds.

### 5. Stateful Database with Stable Identity

PostgreSQL runs as a StatefulSet (not Deployment) providing stable network identity via headless service. Pod restarts or rescheduling preserves the same DNS name and persistent volume. Data survives all pod lifecycle events.

### 6. Traefik Middleware Chain

HTTP traffic passes through multiple Traefik middleware layers: HTTPS redirect (301), security headers (HSTS, X-Frame-Options, X-Content-Type-Options), and rate limiting (100 req/s with burst). Defense in depth at the edge.

### 7. Environment-Specific Overlays

Kustomize overlays enable identical base configuration with environment-specific patches. Development overlay adds `dev-` prefix to all resources and labels them accordingly. Zero code duplication between environments.

### 8. Health Probe Dual-Check System

Liveness probes restart dead containers. Readiness probes remove unhealthy pods from service load balancers. PostgreSQL uses exec probes with `pg_isready`. Backend has separate `/healthz` and `/ready` endpoints for fine-grained health state.

### 9. Auto-Provisioning Database Schema

Backend automatically creates required database tables on startup. No manual migrations needed. Table creation is idempotent (`CREATE TABLE IF NOT EXISTS`), safe for rolling updates and new deployments.

### 10. Immutable Infrastructure

Every build produces uniquely tagged container images. Kubernetes manifests reference specific build numbers. Rollbacks are instant by reverting the image tag in Git. No mutable "latest" tags in production deployments.


## CI/CD Flow



1. Developer Push → Jenkins Polls SCM → Detects Change

2. Parallel: Backend Tests | Frontend Tests

3. Parallel: Build Backend Image | Build Frontend Image

4. Push to Docker Hub (build-number + latest tags)

5. Update deployment.yaml with new image tags
  
6. Commit & Push updated manifests to Git

7. ArgoCD Detects Git Change → Auto-Sync to K3s Cluster

8. Rolling Update with Zero Downtime




## Security Features

- Non-root containers with dropped capabilities
- Network policies with default-deny posture
- Secrets base64-encoded (ready for Sealed Secrets)
- Traefik security headers (HSTS, XSS protection, clickjacking prevention)
- Rate limiting at ingress (100 req/s)
- Pod Security Context hardening
- Read-only root filesystem where possible


## Key Design Decisions

| Decision                       | Rationale                                                   |
| ------------------------------ | ----------------------------------------------------------- |
| StatefulSet for PostgreSQL     | Stable network identity and persistent storage for database |
| ClusterIP for all services     | No external exposure, Ingress handles all traffic           |
| 2 replicas for stateless tiers | High availability with minimal resource usage               |
| Kustomize overlays             | DRY configuration, environment-specific customization       |
| Jenkins for CI only            | Separation of concerns, ArgoCD handles CD                   |
| ArgoCD auto-sync               | GitOps principle, Git as single source of truth             |
| Immutable image tags           | Enables instant rollbacks, audit trail                      |
| Parallel pipeline stages       | 50% faster CI builds                                        |
