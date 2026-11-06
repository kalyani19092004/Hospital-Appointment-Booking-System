pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies') {
            steps {
                // For a Windows Jenkins agent use: bat 'npm.cmd install'
                // For a Linux Jenkins agent use: sh 'npm install'
                bat 'npm.cmd install'
            }
        }
        stage('Application Validation') {
            steps {
                bat 'node --check server.js'
                bat 'node --check database.js'
                bat 'node --check public/script.js'
            }
        }
    }
    post {
        success { echo 'Hospital Appointment Booking System validation successful.' }
        failure { echo 'Pipeline failed. Check the console output.' }
    }
}
