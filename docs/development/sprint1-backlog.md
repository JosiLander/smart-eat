# Smart-Eat App - Sprint 1 Backlog

## Sprint Goal
To deliver a functional MVP that allows users to scan groceries, manage a basic inventory, and receive simple recipe suggestions.

## User Stories

### Core Scanning Functionality
* **US-001:** As a user, I can take a photo of my groceries.
  - **Acceptance Criteria:** Camera opens, photo can be captured, image is saved
  - **Story Points:** 3
  - **Priority:** High

* **US-002:** As a user, the app automatically recognizes products from the photo.
  - **Acceptance Criteria:** AI model identifies items with confidence scores
  - **Story Points:** 5
  - **Priority:** High

* **US-003:** As a user, the app automatically reads the "best before" dates from the photo.
  - **Acceptance Criteria:** OCR extracts dates from product labels
  - **Story Points:** 5
  - **Priority:** High

### Inventory Management
* **US-004:** As a user, I can manually edit or confirm the identified items and dates.
  - **Acceptance Criteria:** Edit interface for items and dates, save changes
  - **Story Points:** 3
  - **Priority:** High

* **US-005:** As a user, the app provides a suggested "best before" date for fresh produce.
  - **Acceptance Criteria:** Smart date generation for fruits/vegetables
  - **Story Points:** 2
  - **Priority:** Medium

### Recipe Functionality
* **US-006:** As a user, I can view a list of recipes that can be made with my available ingredients.
  - **Acceptance Criteria:** Recipe suggestions based on inventory
  - **Story Points:** 4
  - **Priority:** High

* **US-007:** As a user, the app prioritizes recipes that use ingredients with the earliest expiration dates.
  - **Acceptance Criteria:** Recipe sorting by expiration priority
  - **Story Points:** 3
  - **Priority:** Medium

### Grocery List Management
* **US-008:** As a user, I can view and manage a simple grocery list.
  - **Acceptance Criteria:** Basic list creation, editing, and checking off items
  - **Story Points:** 2
  - **Priority:** Medium

## Technical Tasks

### Front-End Development
* **FE-001:** Set up the project structure and development environment
* **FE-002:** Create the UI for the dashboard with inventory display
* **FE-003:** Implement camera functionality and photo capture
* **FE-004:** Build item review and editing interface
* **FE-005:** Create recipe suggestions screen
* **FE-006:** Implement basic grocery list interface

### Back-End Development
* **BE-001:** Set up the API structure and basic endpoints
* **BE-002:** Create a basic database schema for users, inventory, and recipes
* **BE-003:** Implement user authentication and profile management
* **BE-004:** Build inventory CRUD operations
* **BE-005:** Create recipe search and filtering endpoints
* **BE-006:** Implement grocery list management endpoints

### AI/ML Development
* **AI-001:** Create mock services to simulate AI functionality
* **AI-002:** Implement basic object recognition mock
* **AI-003:** Build OCR date extraction mock
* **AI-004:** Create recipe recommendation algorithm mock

## Definition of Done
A deployable app where a user can:
- Scan groceries and see them in a list with dates
- Get basic recipe suggestions based on available ingredients
- Manage a simple grocery list
- Edit and confirm scanned items
- View expiration dates for all items

## Sprint Metrics
- **Velocity Target:** 30 story points
- **Burndown Tracking:** Daily progress updates
- **Quality Gates:** Code review, testing, documentation
- **Demo Preparation:** Working demo for stakeholders 