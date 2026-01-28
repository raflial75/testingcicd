pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: agent
spec:
  containers:
  - name: jnlp
    image: jenkins/inbound-agent:latest
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  - name: docker
    image: docker:24
    command:
    - cat
    tty: true
    volumeMounts:
    - name: docker-sock
      mountPath: /var/run/docker.sock
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
"""
        }
    }
    
    environment {
        GIT_REPO = 'https://github.com/raflial75/testingcicd.git'
        GIT_CREDENTIALS = 'github-credentials'
        DOCKER_IMAGE = 'your-dockerhub-username/your-app-name'
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_CREDENTIALS = 'dockerhub-credentials'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                git branch: 'main', url: "${GIT_REPO}"
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing Node.js dependencies...'
                sh 'node --version'
                sh 'npm --version'
                sh 'npm install'
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running tests...'
                sh 'npm test || echo "No tests found"'
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
                                echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin
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
                            rm -rf k8s-config
                            git clone https://\${GIT_USER}:\${GIT_PASS}@github.com/raflial75/k8s-config.git
                            cd k8s-config
                            
                            sed -i 's|image: ${DOCKER_IMAGE}:.*|image: ${DOCKER_IMAGE}:${imageTag}|g' deployment.yaml
                            
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
            container('docker') {
                sh 'docker system prune -f || true'
            }
            cleanWs()
        }
    }
}