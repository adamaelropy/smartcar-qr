# 🚗 SmartCar QR — Final User Stories

## Table of Contents

- [Epic 1 — Landing & Authentication](#epic-1--landing--authentication)
- [Epic 2 — Registration](#epic-2--registration)
- [Epic 3 — Vehicle Services](#epic-3--vehicle-services)
- [Epic 4 — Profile Management](#epic-4--profile-management)
- [Epic 5 — SmartCar QR](#epic-5--smartcar-qr)
- [Epic 6 — Messaging](#epic-6--messaging)
- [📋 Final Backlog Summary](#-final-backlog-summary)

---

## Epic 1 — Landing & Authentication

### US-01 — View Landing Page
**As a** visitor, **I want to** view the SmartCar QR landing page, **so that** I can understand the system and access the application.

**Acceptance Criteria:**
- The landing page is accessible without authentication.
- The page provides information about SmartCar QR.
- The visitor can access the application.
- The visitor can navigate to Login or Sign Up.

### US-02 — Create an Account
**As a** new user, **I want to** create an account, **so that** I can register my vehicle with SmartCar QR.

**Acceptance Criteria:**
- The user can enter a unique username.
- The user can enter and confirm a password.
- Password requirements are validated.
- Duplicate usernames are rejected.
- Successful signup creates the account.
- The user is authenticated after successful signup.
- Anonymous messages previously sent from the same device can be automatically linked to the new account.

### US-03 — Log In
**As a** registered user, **I want to** log in, **so that** I can access my SmartCar QR account.

**Acceptance Criteria:**
- The user can enter their username and password.
- Valid credentials authenticate the user.
- Invalid credentials display an error.
- Successful login redirects the user appropriately.
- An incomplete account is redirected to registration.

### US-04 — Access Protected Pages
**As an** authenticated user, **I want** protected pages to be restricted to my account, **so that** my personal information remains secure.

**Acceptance Criteria:**
- Unauthenticated users cannot access protected dashboard pages.
- Unauthenticated users are redirected to Login.
- Authenticated users can access protected pages.
- Users with incomplete registration are redirected to Registration.

---

## Epic 2 — Registration

### US-05 — Complete Personal Information
**As a** new user, **I want to** provide my personal information, **so that** my SmartCar QR profile can be completed.

**Acceptance Criteria:**
- The user can enter their full name.
- The user can enter their age.
- The user can enter their phone number.
- The user can enter their email address.
- Required fields are validated before submission.

### US-06 — Add an Emergency Contact
**As a** vehicle owner, **I want to** add an emergency contact, **so that** someone can be notified if an emergency occurs.

**Acceptance Criteria:**
- The user can enter the emergency contact's name.
- The user can enter the emergency contact's phone number.
- The user can specify the relationship.
- Required information is validated.
- The emergency contact is associated with the user's account.

### US-07 — Register a Vehicle
**As a** vehicle owner, **I want to** register my vehicle, **so that** it can be associated with my SmartCar QR account.

**Acceptance Criteria:**
- The user can enter the vehicle plate number.
- The user can enter the car name.
- The user can enter the model year.
- The plate number must be unique.
- Vehicle information is validated before submission.

### US-08 — Complete Registration Successfully
**As a** new user, **I want** my profile, emergency contact, and vehicle to be registered together, **so that** my account is ready to use.

**Acceptance Criteria:**
- Personal information is saved.
- Emergency contact information is saved.
- Vehicle information is saved.
- A unique QR token is generated for the vehicle.
- The registration succeeds only when all required operations succeed.
- A failed registration does not leave incomplete database changes.
- Successful registration redirects the user to the dashboard.

---

## Epic 3 — Vehicle Services

### US-09 — Browse Vehicle Services
**As a** vehicle owner, **I want to** browse automotive services, **so that** I can find a service I need.

**Acceptance Criteria:**
- Available automotive services are displayed.
- Each service displays its name.
- Each service displays its service type.
- Each service displays its location.
- Service availability is displayed.
- The user can open a service to view additional details.

### US-10 — Search for a Service
**As a** vehicle owner, **I want to** search for a service, **so that** I can find it quickly.

**Acceptance Criteria:**
- A search field is available.
- The user can search by service name.
- Search is case-insensitive.
- Matching services are displayed.
- Clearing the search displays all services again.

### US-11 — Filter Services
**As a** vehicle owner, **I want to** filter services, **so that** I can find relevant automotive providers.

**Acceptance Criteria:**
- The user can filter by service type.
- The user can filter by location.
- The user can filter by availability.
- Multiple filters can be applied.
- Results update according to the selected filters.
- Filtering is performed using the services already loaded by the application.

---

## Epic 4 — Profile Management

### US-12 — View Profile
**As a** vehicle owner, **I want to** view my profile, **so that** I can see my personal, emergency contact, and vehicle information.

**Acceptance Criteria:**
- Personal information is displayed.
- Emergency contact information is displayed.
- Vehicle information is displayed.
- The user's QR code is accessible.
- Only the authenticated user can access their profile.

### US-13 — Edit Profile
**As a** vehicle owner, **I want to** edit my information, **so that** my account details remain up to date.

**Acceptance Criteria:**
- The user can enter edit mode.
- Personal information can be updated.
- Emergency contact information can be updated.
- Vehicle information can be updated.
- Updated information is validated.
- Changes are saved successfully.

### US-14 — Change Password
**As a** registered user, **I want to** change my password, **so that** my account remains secure.

**Acceptance Criteria:**
- The user must provide their current password.
- The user can enter a new password.
- The user must confirm the new password.
- Password requirements are validated.
- The current password must be verified.
- The password is updated successfully.

### US-15 — Log Out
**As a** registered user, **I want to** log out, **so that** my account remains protected.

**Acceptance Criteria:**
- A logout option is available.
- The authentication session is cleared.
- The user is redirected to Login.
- The user can no longer access protected pages without authenticating again.

---

## Epic 5 — SmartCar QR

### US-16 — View My QR Code
**As a** vehicle owner, **I want to** view my vehicle's QR code, **so that** I can display it on my vehicle.

**Acceptance Criteria:**
- The user's vehicle QR code is displayed.
- The QR code belongs to the user's registered vehicle.
- The QR code can be scanned.
- The QR code links to the vehicle's public QR page.
- The user can access the QR from their profile.

### US-17 — Scan Vehicle QR Code
**As a** passerby, **I want to** scan a vehicle's QR code, **so that** I can interact with the vehicle owner when necessary.

**Acceptance Criteria:**
- Scanning a valid QR code opens the public QR page.
- Vehicle information is displayed.
- The owner's private phone number is not exposed.
- Contact options are available.
- Emergency assistance is available.

### US-18 — Contact Vehicle Owner
**As a** passerby, **I want to** contact the vehicle owner through the QR code, **so that** I can inform them about an issue with their vehicle.

**Acceptance Criteria:**
- The visitor can select an automated message.
- The visitor can send a custom message.
- The visitor does not need the owner's phone number.
- The message is associated with the correct vehicle.
- The owner can view the message from the Messages page.
- A logged-in visitor is identified by their account.
- An unregistered visitor is displayed as "Unknown".
- Anonymous messages are associated with the visitor's anonymous device identity.

### US-19 — Report a Blocked Vehicle
**As a** passerby, **I want to** report a blocked vehicle, **so that** the owner can move their vehicle.

**Acceptance Criteria:**
- A blocked-vehicle communication option is available.
- A predefined blocked-vehicle message can be sent.
- The message is delivered to the vehicle owner.
- The message appears in the owner's Messages page.
- Anonymous visitors appear as "Unknown".
- The owner can respond with the predefined automated reply.
- Anonymous conversations cannot be directly replied to until the sender has an account.

### US-20 — Report an Emergency
**As a** passerby, **I want to** report an emergency involving a vehicle, **so that** the vehicle owner and emergency contact can respond quickly.

**Acceptance Criteria:**
- An emergency option is available on the public QR page.
- The system requests the visitor's GPS location.
- The captured location can be converted into a Google Maps link.
- The emergency communication is associated with the correct vehicle.
- Emergency communication is identifiable as an emergency.
- The emergency message contains the vehicle emergency information.
- If GPS location is available, the message contains the location link.
- If GPS location is unavailable, the emergency message is still recorded with a location-unavailable indication.
- The emergency communication is visible to the vehicle owner.

### US-21 — Preserve Anonymous Device Identity
**As an** anonymous visitor, **I want** my device identity to be preserved, **so that** my messages remain grouped into the same conversation.

**Acceptance Criteria:**
- A unique anonymous device identifier is generated when needed.
- The identifier is stored locally on the visitor's device.
- Multiple messages from the same anonymous device are grouped into the same conversation for the same vehicle.
- Different anonymous devices create separate conversations.
- The same anonymous device can communicate with different vehicles independently.
- The raw anonymous identifier is not exposed to the vehicle owner.
- Anonymous visitors remain unauthenticated and cannot access protected messaging endpoints.

### US-22 — Claim Anonymous Messages After Registration
**As an** anonymous visitor, **I want** my previous messages to be linked to my new account, **so that** I can continue the conversation after registering.

**Acceptance Criteria:**
- Anonymous messages sent before registration are associated with the anonymous device identity.
- During account creation, the anonymous device identity can be submitted with the signup request.
- Matching unclaimed anonymous messages are automatically identified.
- The messages are linked to the newly created user.
- The original message history is preserved.
- The anonymous messages are converted into an authenticated conversation.
- The vehicle owner no longer sees the conversation as "Unknown".
- The vehicle owner sees the new registered username instead.
- The newly registered user can see the previous conversation in their Messages page.
- The original message timestamps and message types are preserved.
- Claiming the messages is idempotent and does not create duplicate conversations or messages.
- Anonymous messages belonging to different vehicles are linked to the appropriate vehicle-owner conversations.

---

## Epic 6 — Messaging

### US-23 — View Messages
**As a** vehicle owner, **I want to** view messages sent through my vehicle's QR code, **so that** I know when someone is trying to contact me.

**Acceptance Criteria:**
- The Messages page displays received communications.
- Messages are associated with the correct vehicle.
- Conversations can be opened.
- Message types can be identified.
- Conversation history is displayed.
- Anonymous conversations display the sender as "Unknown".
- Different anonymous devices are displayed as separate conversations.
- Claimed anonymous conversations display the registered user's username.

### US-24 — Identify Emergency Messages
**As a** vehicle owner, **I want** emergency messages to be clearly identified, **so that** I can prioritize urgent situations.

**Acceptance Criteria:**
- Emergency messages have a distinct visual indicator.
- Emergency communications can be distinguished from normal messages.
- Emergency information is easy to identify.
- Emergency conversations are prioritized visually.
- Emergency location information is displayed when available.

### US-25 — Mark Anonymous Conversation as Read
**As a** vehicle owner, **I want to** mark anonymous messages as read, **so that** I can keep track of which messages require my attention.

**Acceptance Criteria:**
- Anonymous conversations can be marked as read.
- Only messages belonging to the selected anonymous conversation are marked as read.
- Other anonymous conversations remain unread.
- The unread count is updated correctly.

### US-26 — Send Automated Reply
**As a** vehicle owner, **I want to** send an automated reply, **so that** I can respond quickly to someone contacting me.

**Acceptance Criteria:**
- An automated reply option is available inside a conversation.
- The owner can send the predefined response "Ok! I'm coming!"
- The reply is associated with the correct conversation.
- The reply appears in the conversation history.
- Automated replies are available for authenticated conversations.
- Anonymous conversations cannot receive a direct reply before the sender creates an account.

### US-27 — Continue Conversation After Anonymous User Registers
**As a** newly registered user, **I want to** continue conversations that I started anonymously, **so that** I do not lose my previous communication history.

**Acceptance Criteria:**
- Previously sent anonymous messages appear in the user's Messages page after registration.
- The conversation is associated with the newly created account.
- The vehicle owner sees the registered username instead of "Unknown".
- The original conversation history remains available.
- New messages are added to the same authenticated conversation.
- The user can receive and send messages through the authenticated conversation.

---

## 📋 Final Backlog Summary

| ID | User Story | Epic | Priority |
|---|---|---|---|
| US-01 | View Landing Page | Landing & Authentication | Medium |
| US-02 | Create an Account | Landing & Authentication | High |
| US-03 | Log In | Landing & Authentication | High |
| US-04 | Access Protected Pages | Landing & Authentication | High |
| US-05 | Complete Personal Information | Registration | High |
| US-06 | Add an Emergency Contact | Registration | High |
| US-07 | Register a Vehicle | Registration | High |
| US-08 | Complete Registration Successfully | Registration | High |
| US-09 | Browse Vehicle Services | Vehicle Services | Medium |
| US-10 | Search for a Service | Vehicle Services | Medium |
| US-11 | Filter Services | Vehicle Services | Medium |
| US-12 | View Profile | Profile Management | High |
| US-13 | Edit Profile | Profile Management | High |
| US-14 | Change Password | Profile Management | High |
| US-15 | Log Out | Profile Management | High |
| US-16 | View My QR Code | SmartCar QR | High |
| US-17 | Scan Vehicle QR Code | SmartCar QR | High |
| US-18 | Contact Vehicle Owner | SmartCar QR | High |
| US-19 | Report a Blocked Vehicle | SmartCar QR | High |
| US-20 | Report an Emergency | SmartCar QR | **Critical** |
| US-21 | Preserve Anonymous Device Identity | SmartCar QR | High |
| US-22 | Claim Anonymous Messages After Signup | SmartCar QR | High |
| US-23 | View Messages | Messaging | High |
| US-24 | Identify Emergency Messages | Messaging | High |
| US-25 | Mark Anonymous Conversation as Read | Messaging | Medium |
| US-26 | Send Automated Reply | Messaging | Medium |
| US-27 | Continue After Anonymous Registration | Messaging | High |

**Totals:** 27 user stories · 1 Critical · 18 High · 8 Medium