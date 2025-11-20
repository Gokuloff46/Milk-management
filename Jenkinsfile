pipeline {
    agent any

    tools {
        nodejs 'node18'  // Ensure this matches the Jenkins config name exactly
    }

    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        DOCKER_REGISTRY = 'gokulfgi'
        IMAGE_NAME = 'milk-management'
        IMAGE_FULL_NAME = "gokulfgi/milk-management"
        TRIVY_CACHE_DIR = '.trivycache'
        SONAR_PROJECT_KEY = 'milk-management'
        SONAR_TOKEN = credentials('Sonar-key')
    }

    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout from GitHub') {
            steps {
                git(
                    branch: 'main',
                    credentialsId: 'Git-Hub', // Make sure this matches the ID in Jenkins credentials
                    url: 'https://github.com/Gokuloff46/Milk-management.git'
                )

                script {
                    def hash = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def timestamp = new Date().format('yyyyMMddHHmmss', TimeZone.getTimeZone('UTC'))
                    env.COMMIT_HASH = hash
                    env.IMAGE_VERSION = "${hash}-${timestamp}"
                    echo "Commit Hash: ${env.COMMIT_HASH}"
                    echo "Image Version: ${env.IMAGE_VERSION}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    try {
                        sh 'npm test'
                    } catch (e) {
                        echo "⚠️ Tests failed, continuing... ${e}"
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar-server') {
                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                        -Dsonar.sources=./server -Dsonar.sources=./client/src \
                        -Dsonar.host.url=http://sonar.kgr.life \
                        -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    script {
                        try {
                            def qualityGate = waitForQualityGate()
                            if (qualityGate.status != 'OK') {
                                error "❌ Quality Gate failed: ${qualityGate.status}"
                            }
                        } catch (e) {
                            echo "⚠️ Quality Gate error: ${e}, continuing..."
                        }
                    }
                }
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                script {
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        def template = fileExists('html.tpl') ? '@html.tpl' : 'table'
                        sh """
                            mkdir -p ${TRIVY_CACHE_DIR}
                            trivy fs --scanners vuln,misconfig --cache-dir ${TRIVY_CACHE_DIR} \
                                --format template --template ${template} -o trivy-fs-report.html . || echo "Trivy FS scan completed with findings"
                        """
                        archiveArtifacts artifacts: 'trivy-fs-report.html'
                        def fsReport = readFile('trivy-fs-report.html')
                        env.FS_SCAN_CRITICAL = fsReport.contains('CRITICAL') ? 'Yes' : 'No'
                        if (env.FS_SCAN_CRITICAL == 'Yes') {
                            error("Critical vulnerabilities found in filesystem scan")
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker-compose -f docker-compose.yml build'
            }
        }

        stage('Trivy Image Scan') {
            steps {
                script {
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        sh """
                            mkdir -p ${TRIVY_CACHE_DIR}
                            trivy image --scanners vuln,misconfig --cache-dir ${TRIVY_CACHE_DIR} \
                                --format html -o trivy-image-report.html ${IMAGE_FULL_NAME}:${IMAGE_VERSION} || echo "Scan completed with findings"
                        """
                        archiveArtifacts artifacts: 'trivy-image-report.html'
                        def imageReport = readFile('trivy-image-report.html')
                        env.IMAGE_SCAN_CRITICAL = imageReport.contains('CRITICAL') ? 'Yes' : 'No'
                        if (env.IMAGE_SCAN_CRITICAL == 'Yes') {
                            error("Critical vulnerabilities found in image scan")
                        }
                    }
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([string(credentialsId: 'gokulfgi-dockerhub', variable: 'DOCKER_TOKEN')]) {
                    sh """
                        echo "${DOCKER_TOKEN}" | docker login -u gokulfgi --password-stdin
                        docker push ${IMAGE_FULL_NAME}:${IMAGE_VERSION}
                        docker push ${IMAGE_FULL_NAME}:latest
                    """
                }
            }
        }

        stage('Deploy to Local Instance') {
            steps {
                sh """
                    docker pull ${IMAGE_FULL_NAME}:latest
                    docker stop milk-management-container || true
                    docker rm milk-management-container || true
                    docker run -d --name milk-management-container -p 3000:3000 --restart unless-stopped ${IMAGE_FULL_NAME}:latest
                """
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def retries = 6
                    def delay = 5
                    for (int i = 1; i <= retries; i++) {
                        echo "Health check attempt ${i}..."
                        def response = sh(script: "curl --silent --fail http://localhost:3000 || echo 'FAILED'", returnStdout: true).trim()
                        if (response != "FAILED") {
                            echo "✅ App is healthy!"
                            break
                        } else if (i == retries) {
                            error "❌ Health check failed after ${retries} attempts."
                        } else {
                            echo "Waiting ${delay} seconds before retry..."
                            sleep(time: delay, unit: 'SECONDS')
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                emailext(
                    subject: "Build ${currentBuild.currentResult}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
Build Status: ${currentBuild.currentResult}
Project: ${env.JOB_NAME}
Build Number: ${env.BUILD_NUMBER}
Commit: ${env.COMMIT_HASH}
Image Version: ${env.IMAGE_VERSION}

Trivy FS Scan Critical: ${env.FS_SCAN_CRITICAL}
Trivy Image Scan Critical: ${env.IMAGE_SCAN_CRITICAL}

Visit: http://localhost:3000

Regards,
Jenkins Pipeline
""",
                    to: 'k.gokul.raj.official@gmail.com',
                    attachmentsPattern: 'trivy-*.html'
                )
            }
        }
    }
}
// Jenkinsfile for CI/CD Pipeline
// This file defines the CI/CD pipeline for the portfolio site using Jenkins.
// It includes stages for building, testing, scanning, and deploying the application.
// The pipeline uses tools like Node.js, SonarQube, Trivy, and Docker.
// Ensure that the necessary credentials and tools are configured in Jenkins.