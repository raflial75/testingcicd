pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE = 'your-username/simple-cicd-app'
        GIT_REPO = 'https://github.com/raflial75/testingcicd.git'
        CONFIG_REPO = 'https://github.com/your-username/k8s-config.git'
        DOCKER_CREDENTIALS = 'docker-hub-credentials'
        GIT_CREDENTIALS = 'github-credentials'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                git branch: 'main', url: "${GIT_REPO}"
            }
        }

        stage('Setup Node') {
            steps {
                container(node){
                    sh '''
                    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                    apt-get install -y nodejs
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                container('node') {
                    echo 'Installing Node.js dependencies...'
                    sh 'npm install'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                container('node') {
                    echo 'Running tests...'
                    sh 'npm test'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                container('docker') {
                    script {
                        echo 'Building Docker image...'
                        def imageTag = "${env.BUILD_NUMBER}"
                        sh """
                            docker build -t ${DOCKER_IMAGE}:${imageTag} .
                            docker tag ${DOCKER_IMAGE}:${imageTag} ${DOCKER_IMAGE}:latest
                        """
                    }
                }
            }
        }
        
        stage('Push Docker Image') {
            steps {
                container('docker') {
                    script {
                        echo 'Pushing Docker image to registry...'
                        def imageTag = "${env.BUILD_NUMBER}"
                        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS}", 
                                                          usernameVariable: 'DOCKER_USER', 
                                                          passwordVariable: 'DOCKER_PASS')]) {
                            sh """
                                echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin ${DOCKER_REGISTRY}
                                docker push ${DOCKER_IMAGE}:${imageTag}
                                docker push ${DOCKER_IMAGE}:latest
                            """
                        }
                    }
                }
            }
        }
        
        stage('Update Kubernetes Manifests') {
            steps {
                script {
                    echo 'Updating Kubernetes manifests...'
                    def imageTag = "${env.BUILD_NUMBER}"
                    
                    withCredentials([usernamePassword(credentialsId: "${GIT_CREDENTIALS}", 
                                                      usernameVariable: 'GIT_USER', 
                                                      passwordVariable: 'GIT_PASS')]) {
                        sh """
                            # Clean up any existing clone
                            rm -rf k8s-config
                            
                            # Clone config repository
                            git clone https://\${GIT_USER}:\${GIT_PASS}@github.com/your-username/k8s-config.git
                            cd k8s-config
                            
                            # Update image tag in deployment file
                            sed -i 's|image: ${DOCKER_IMAGE}:.*|image: ${DOCKER_IMAGE}:${imageTag}|g' deployment.yaml
                            
                            # Commit and push changes
                            git config user.email "jenkins@ci.com"
                            git config user.name "Jenkins CI"
                            git add deployment.yaml
                            git commit -m "Update image to ${imageTag} - Build #${env.BUILD_NUMBER}" || echo "No changes to commit"
                            git push origin main
                        """
                    }
                }
            }
        }
        
        stage('Trigger ArgoCD Sync') {
            steps {
                echo 'ArgoCD will automatically detect changes and sync...'
                echo "Build completed! Image tag: ${env.BUILD_NUMBER}"
            }
        }
    }
    
    post {
        success {
            echo '✅ Pipeline completed successfully!'
            echo "Docker image: ${DOCKER_IMAGE}:${env.BUILD_NUMBER}"
        }
        failure {
            echo '❌ Pipeline failed! Check logs for details.'
        }
        always {
            echo 'Cleaning up...'
            sh 'docker system prune -f || true'
            cleanWs()
        }
    }
}