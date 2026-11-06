# Hospital Appointment Booking System

A student DevOps lab project with patient registration/login, doctor listing and specialization search, appointment booking/cancellation, and an admin appointment view.

## Technology stack
- HTML, CSS, JavaScript
- Node.js and Express.js
- SQLite
- Git and GitHub
- Jenkins
- Docker
- Selenium WebDriver
- Optional Kubernetes deployment manifest in `k8s/`

## 1. Install dependencies
Open a terminal in this folder:

```cmd
npm.cmd install
```

If dependencies were already installed, this command checks/installs what is listed in `package.json`.

## 2. Run the application

```cmd
npm.cmd start
```

Open http://localhost:3000

The SQLite database file `hospital.db` is created automatically. Five sample doctors are inserted on first run.

## 3. Features to demonstrate
1. Register a patient using name, email and password (minimum 6 characters).
2. Log in as the patient.
3. Search doctors by specialization, for example `Cardiology`.
4. Select a doctor and book an appointment using a future date and time.
5. View the appointment and cancel it.
6. Use the demo admin login to view all appointments.

Demo admin credentials:
- Email: `admin@hospital.com`
- Password: `Admin@123`

This is a classroom demonstration login, not production-grade admin authentication.

## 4. Run the HTTP smoke test
Keep the application running in one terminal. Open a second terminal:

```cmd
node tests/smoke-test.js
```

Expected output:
`PASS: application health endpoint is working.`

## 5. Selenium test
Keep the application running, then execute:

```cmd
node tests/selenium-test.js
```

Requires Google Chrome. Selenium Manager may manage the matching driver automatically; if your lab network blocks driver downloads, configure a compatible ChromeDriver.

## 6. Docker

```cmd
docker build -t hospital-appointment:latest .
docker run -d --name hospital-appointment -p 3000:3000 hospital-appointment:latest
```

Open http://localhost:3000

To stop/remove the container:

```cmd
docker stop hospital-appointment
docker rm hospital-appointment
```

## 7. Kubernetes (optional if required in your lab)

Ensure your Kubernetes cluster is running and the image is available to its nodes:

```cmd
kubectl apply -f k8s/deployment.yaml
kubectl get deployments
kubectl get pods
kubectl get services
```

For a local cluster such as Minikube, you may need to build the image inside Minikube's Docker environment or load it into the cluster before applying the manifest.

## 8. Git and GitHub

Create an empty GitHub repository named `Hospital-Appointment-Booking-System`, then run:

```cmd
git init
git add .
git commit -m "Initial Hospital Appointment Booking System"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/Hospital-Appointment-Booking-System.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your own GitHub username.

## 9. Jenkins
Create a Pipeline job in Jenkins and connect it to your GitHub repository. Select **Pipeline script from SCM**, choose **Git**, enter the repository URL, and set the Script Path to `Jenkinsfile`.

The included Jenkinsfile uses Windows `bat` commands. If Jenkins runs on Linux, replace those steps with `sh 'npm install'` and `sh 'node --check server.js'` etc.

## Important notes
- This is an educational demo, not a real hospital system.
- Do not enter real patient or medical information.
- For a real deployment, configure secure session secrets, HTTPS, production-grade authentication/authorization, input validation, backups, and persistent database storage.
- SQLite data is stored in `hospital.db`. A container's filesystem is temporary unless a volume is configured.
