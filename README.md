# 🚗 SmartCar QR

**SmartCar QR** is a full-stack web application that connects vehicles with a unique QR code to provide a simple and secure way to communicate with vehicle owners or their emergency contacts.

The system is designed to help in everyday situations such as a vehicle blocking another car in a parking area, as well as emergency situations such as accidents where contacting a registered relative may be necessary.

---

## 📌 Project Overview

SmartCar QR provides vehicle owners with a personalized account and a unique QR code associated with their vehicle.

After scanning the QR code, a user can choose between two main actions:

* 🚗 **Contact Vehicle Owner** — Send a message or initiate a call when the vehicle is blocking another vehicle or requires the owner's attention.
* 🚨 **Emergency Contact** — Send an emergency message or initiate a call to the vehicle owner's registered relative, including the incident location when available.

The application also provides vehicle-related services, user profile management, communication history, and personalized settings.

---

## ✨ Main Features

### 🔐 Authentication

* User registration and login
* Username and password authentication
* Secure password requirements:

  * Minimum 6 characters
  * Maximum 10 characters
  * At least 1 uppercase letter
  * At least 1 lowercase letter
  * At least 1 number
  * At least 1 special character
* Password confirmation during registration
* Forgot password functionality
* Secure password storage

### 👤 User Profile

Users can view and manage their personal information, including:

* Full name
* Username
* Age
* Phone number
* Email address
* Emergency relative name
* Emergency relative phone number

The profile also provides:

* Change password
* Logout
* Personal QR code

### 🚘 My Vehicle

Users can view and edit their registered vehicle information:

* Plate number
* Car name
* Year model

Each vehicle is associated with a unique QR code.

### 📱 Smart QR Code

Each registered vehicle receives a unique QR code.

After scanning the QR code, users can choose between two options:

#### 🚗 Contact Vehicle Owner

* Send a message
* Initiate a call

This can be used when a vehicle is blocking another car or requires the owner's attention.

#### 🚨 Emergency

* Send an emergency message to the registered relative
* Initiate a call to the registered relative

Sensitive personal information will not be stored directly inside the QR code. Instead, the QR code will reference a unique vehicle identifier handled by the backend.

### 🛠️ Car Services

The Home page provides vehicle-related services such as:

* Tyre Change
* Oil Change
* Car Wash
* Tow Service

Services can be searched and filtered based on the available service types.

Maintenance centers can include:

* Center name
* Location
* Availability
* Service type

### 💬 Messages & Calls

Users can view communication activity associated with their vehicle's QR code.

Each record can include:

* Unique 10-digit communication ID
* Communication type
* Sent/received status
* Message content when applicable
* Date
* Time

### 🎨 Theme

The application supports:

* Light Mode
* Dark Mode

---

## 🧭 Application Navigation

After authentication, users will have access to the main dashboard navigation:

```text
SmartCar QR

Home
Messages / Calls
My Vehicle
Profile
```

The application header will also provide a theme control for switching between Light and Dark Mode.

---

## 🏗️ Project Architecture

SmartCar QR follows a full-stack architecture:

```text
┌─────────────────────────────┐
│          Frontend           │
│       React + JavaScript    │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│           Backend           │
│     Node.js + Express.js    │
└──────────────┬──────────────┘
               │
               │ SQL
               ▼
┌─────────────────────────────┐
│          Database           │
│            MySQL            │
└─────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* React
* JavaScript
* HTML5
* CSS3
* React Router

### Backend

* Node.js
* Express.js
* REST API

### Database

* MySQL

### Development Tools

* Git
* GitHub
* VS Code
* npm

---

## 🎯 Project Goals

The main goals of SmartCar QR are to:

1. Provide a convenient way to identify and communicate with vehicle owners.
2. Simplify communication in parking-related situations.
3. Provide an emergency communication mechanism.
4. Securely manage vehicle-owner information.
5. Demonstrate full-stack web development.
6. Implement a real-world application using React, Node.js, Express, and MySQL.
7. Practice collaborative software development using Git and GitHub.

---

**SmartCar QR — Connecting Vehicles, Owners & Emergency Contacts.**
