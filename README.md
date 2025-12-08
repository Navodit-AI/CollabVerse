CollabVerse – Student Collaboration & Project Finder Live Demo

Frontend: https://collab-verse-lovat.vercel.app

Backend API: https://collabverse-backend.onrender.com

Overview

CollabVerse is a collaboration platform designed for students to find teammates for academic projects,
hackathons, and startup ideas. Students often struggle to find peers with complementary skills, and 
existing communication channels are scattered and informal. CollabVerse provides a centralized platform where 
users can create project ideas, search for collaborators, and join projects based on their interests and skill sets. 


## Key Features

* User authentication (JWT)
* Student profile management
* Post and manage project ideas (CRUD)
* Search for projects and collaborators
* Filter by domain and skills
* Sort by relevance and dates
* Server-side pagination
* Collaboration request system
* Likes and comments
* Fully deployed frontend and backend


## System Architecture

**Architecture Overview**
Frontend (React.js) → Backend (Node.js + Express) → MongoDB Atlas

**Hosting**

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas


## Tech Stack

### Frontend

* React.js
* React Router
* *HTML
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Authentication

* JWT



## API Endpoints

| Method | Endpoint               | Description                  |
| ------ | ---------------------- | ---------------------------- |
| POST   | /api/auth/signup       | Register user                |
| POST   | /api/auth/login        | Login                        |
| GET    | /api/users/:id         | Fetch profile                |
| GET    | /api/posts             | Get project ideas            |
| POST   | /api/posts             | Create project               |
| PUT    | /api/posts/:id         | Update project               |
| DELETE | /api/posts/:id         | Delete project               |
| POST   | /api/collab/request    | Send collaboration request   |
| PUT    | /api/collab/accept/:id | Accept collaboration request |



## Searching, Filtering, Sorting, and Pagination

All project retrieval endpoints support:

* keyword search
* filtering by tag, domain, or project status
* sorting (date, likes, collaborators)
* backend pagination using `limit` and `skip`


## Frontend Routes

* Home
* Register
* Login
* Explore Projects
* Post Idea
* Profile
* Dashboard


## Collaboration

Users can:

* send collaboration requests
* accept invitations
* join projects



## CRUD Operations

Implemented for:

* users
* project posts
* likes and comments
* collaboration requests



### Clone the repository

```
git clone https://github.com/your-username/collabverse.git
```

### Frontend setup

```
cd client
npm install
npm start
```

### Backend setup

```
cd server
npm install
npm run dev
```

---

## Deployment

* Frontend deployed on Vercel
* Backend deployed on Render
* Database on MongoDB Atlas


## Future Enhancements

* Real-time chat
* Notifications
* Skill endorsements
* AI-based teammate recommendations

Author

Navodit
