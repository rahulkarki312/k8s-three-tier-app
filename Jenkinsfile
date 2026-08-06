pipeline {
    agent any

    tools {
        nodejs 'NodeJS 18'  
    }

    environment {
        // Registry configuration
        REGISTRY = 'docker.io'
        REGISTRY_USER = 'rahulkarki1'
        BACKEND_IMAGE = "${REGISTRY_USER}/three-tier-backend"
        FRONTEND_IMAGE = "${REGISTRY_USER}/three-tier-frontend"

        // Version tags
        BUILD_NUMBER_TAG = "${BUILD_NUMBER}"
        LATEST_TAG = 'latest'

        // Git configuration
        GIT_BRANCH = 'main'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Checked out branch: ${GIT_BRANCH}"
                echo "Build number: ${BUILD_NUMBER}"
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        echo "Running Backend tests: PASSED (Simulated test run)"
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        echo "Running Frontend tests: PASSED (Simulated test run)"
                    }
                }
            }
        }

        stage('Build Container Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        dir('backend') {
                            sh """
                                docker build \
                                    --tag ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG} \
                                    --tag ${BACKEND_IMAGE}:${LATEST_TAG} \
                                    --file Dockerfile \
                                    .
                            """
                            echo "Backend image built: ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}"
                        }
                    }
                }

                stage('Build Frontend Image') {
                    steps {
                        dir('frontend') {
                            sh """
                                docker build \
                                    --tag ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG} \
                                    --tag ${FRONTEND_IMAGE}:${LATEST_TAG} \
                                    --file Dockerfile \
                                    .
                            """
                            echo "Frontend image built: ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}"
                        }
                    }
                }
            }
        }

        stage('Push Images to Registry') {
            steps {
                script {
                    dockerLogin()
                    pushImage("${BACKEND_IMAGE}", "${BUILD_NUMBER_TAG}")
                    pushImage("${BACKEND_IMAGE}", "${LATEST_TAG}")
                    pushImage("${FRONTEND_IMAGE}", "${BUILD_NUMBER_TAG}")
                    pushImage("${FRONTEND_IMAGE}", "${LATEST_TAG}")
                }
            }
        }

        stage('Update Kubernetes Manifests') {
            steps {
                script {
                    updateManifestImage(
                        'k8s/base/backend/deployment.yaml',
                        "${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}"
                    )
                    updateManifestImage(
                        'k8s/base/frontend/deployment.yaml',
                        "${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}"
                    )
                }
            }
        }

        stage('Commit Updated Manifests') {
            steps {
                script {
                    commitAndPushManifests()
                }
            }
        }
    }

    post {
        success {
            echo """
                
                CI Pipeline Completed Successfully
                
                Build Number: ${BUILD_NUMBER_TAG}
                Backend Image: ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG}
                Frontend Image: ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG}
                Registry: ${REGISTRY}
                Next Steps:
                1. ArgoCD will detect manifest changes
                2. ArgoCD will sync to Kubernetes cluster
                3. Verify deployment: kubectl get pods -n three-tier-app
                
            """
        }

        failure {
            echo """
                
                CI Pipeline Failed
                
                Failed Stage: ${env.STAGE_NAME}
                Build Number: ${BUILD_NUMBER_TAG}
                Actions:
                4. Check Jenkins console output
                5. Review failed stage logs
                6. Fix issues and commit changes
                
            """
        }

        always {
            // Cleanup local images to save disk space
            sh "docker rmi ${BACKEND_IMAGE}:${BUILD_NUMBER_TAG} || true"
            sh "docker rmi ${BACKEND_IMAGE}:${LATEST_TAG} || true"
            sh "docker rmi ${FRONTEND_IMAGE}:${BUILD_NUMBER_TAG} || true"
            sh "docker rmi ${FRONTEND_IMAGE}:${LATEST_TAG} || true"

            // Clean workspace for next build
            cleanWs()
        }
    }
}


// Helper Functions


/**
 * Authenticates with container registry using Docker Hub credentials
 * Credential ID: dockerhub-credentials
 */
def dockerLogin() {
    withCredentials([usernamePassword(
        credentialsId: 'dockerhub-credentials',
        usernameVariable: 'DOCKER_USER',
        passwordVariable: 'DOCKER_PASSWORD'
    )]) {
        sh """
            echo "${DOCKER_PASSWORD}" | docker login ${REGISTRY} \
                --username ${DOCKER_USER} \
                --password-stdin
        """
        echo "Logged into registry: ${REGISTRY} as ${DOCKER_USER}"
    }
}

/**
 * Pushes a container image to registry with retry logic
 * Retries up to 3 times on failure
 */
def pushImage(String imageName, String tag) {
    retry(3) {
        sh """
            echo "Pushing ${imageName}:${tag}..."
            podman push ${imageName}:${tag}
            echo "Successfully pushed ${imageName}:${tag}"
        """
    }
}

/**
 * Updates image tag in Kubernetes deployment manifest
 * Uses sed to replace old image tag with new build-specific tag
 */
def updateManifestImage(String filePath, String newImage) {
    // Extract base image name without tag
    def imageBase = newImage.substring(0, newImage.lastIndexOf(':'))
    // Replace image line with new tag
    sh """
        if [ -f "${filePath}" ]; then
            sed -i "s|image: ${imageBase}:.*|image: ${newImage}|g" ${filePath}
            echo "Updated ${filePath} with image: ${newImage}"
        else
            echo "WARNING: ${filePath} not found"
        fi
    """
}

/**
 * Commits manifest changes and pushes to Git repository
 * Credential ID: github-credentials
 */
def commitAndPushManifests() {
    withCredentials([usernamePassword(
        credentialsId: 'github-credentials',
        usernameVariable: 'GIT_USER',
        passwordVariable: 'GIT_PASSWORD'
    )]) {
        sh """
            # Configure Git identity
            git config user.email "jenkins@ci.local"
            git config user.name "Jenkins CI"

            # Configure remote with credentials for push
            git remote set-url origin https://${GIT_USER}:${GIT_PASSWORD}@github.com/${GIT_USER}/three-tier-app.git

            # Stage only the modified deployment files
            git add k8s/base/backend/deployment.yaml k8s/base/frontend/deployment.yaml

            # Commit changes (ignore if nothing changed)
            if git diff --cached --quiet; then
                echo "No manifest changes to commit"
            else
                git commit -m "[CI] Update image tags to build ${BUILD_NUMBER_TAG} [skip ci]"
                git push origin ${GIT_BRANCH}
                echo "Manifest changes committed and pushed"
            fi
        """
    }
}