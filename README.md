\# AI Resume Analyzer 🚀



A full-stack AI-powered resume analysis platform designed to help job seekers optimize their resumes for Applicant Tracking Systems (ATS). The application parses PDF resumes, evaluates resume quality, identifies missing skills and keywords, and provides actionable recommendations to improve hiring success.



\---



\## Features



\### User Authentication



\* Secure user registration and login

\* JWT-based authentication and authorization

\* Password encryption using bcryptjs

\* Protected user dashboard



\### Resume Management



\* Upload PDF resumes

\* Store and manage resume history

\* View previous analyses and reports

\* Delete uploaded resumes



\### ATS Resume Analysis



\* Automated PDF text extraction

\* ATS compatibility score generation (0–100)

\* Keyword and skill gap detection

\* Resume strengths and weaknesses analysis

\* Personalized improvement recommendations

\* Target job description matching



\### Analytics Dashboard



\* ATS score visualization

\* Resume performance tracking

\* Historical analysis reports

\* Interactive charts and statistics

\* Resume comparison insights



\---



\## Technology Stack



\### Frontend



\* React.js

\* TypeScript

\* Tailwind CSS

\* Axios

\* Recharts

\* Lucide React



\### Backend



\* Node.js

\* Express.js

\* TypeScript

\* Multer

\* PDF Parser

\* JSON Web Tokens (JWT)

\* bcryptjs



\### Database



\* MongoDB Atlas

\* Mongoose



\### AI Engine



\* Large Language Model (LLM) powered resume evaluation

\* Intelligent keyword extraction

\* Resume scoring and optimization recommendations



\---



\## Project Structure



```bash

AI-Resume-Analyzer

│

├── client

│   ├── src

│   │   ├── components

│   │   ├── pages

│   │   ├── services

│   │   ├── hooks

│   │   └── utils

│

├── server

│   ├── controllers

│   ├── models

│   ├── routes

│   ├── middleware

│   ├── uploads

│   └── utils

│

├── data

├── public

├── README.md

└── package.json

```



\---



\## Environment Variables



Create a `.env` file in the root directory.



```env

PORT=5000



MONGODB\\\_URI=your\\\_mongodb\\\_connection\\\_string



JWT\\\_SECRET=your\\\_secure\\\_jwt\\\_secret



AI\\\_API\\\_KEY=your\\\_ai\\\_api\\\_key

```



\---



\## Installation



\### Clone Repository



```bash

git clone https://github.com/yourusername/AI-Resume-Analyzer.git



cd AI-Resume-Analyzer

```



\### Install Dependencies



```bash

npm install

```



\### Start Development Server



```bash

npm run dev

```



Application will be available at:



```text

http://localhost:3000

```



\---



\## Build for Production



```bash

npm run build

```



Run production server:



```bash

npm start

```



\---



\## Core Functionalities



\### Resume Parsing



\* PDF text extraction

\* Resume content processing

\* Structured data generation



\### ATS Evaluation



\* Resume scoring

\* Keyword matching

\* Skill analysis

\* Formatting assessment



\### Recommendation Engine



\* Resume improvement suggestions

\* Missing skill identification

\* Optimization strategies



\### Dashboard Analytics



\* Performance visualization

\* Resume history tracking

\* ATS score comparison



\---



\## Future Enhancements



\* AI Cover Letter Generator

\* Interview Question Generator

\* Job Description Matching Engine

\* Resume Builder

\* LinkedIn Profile Analysis

\* Career Roadmap Suggestions



\---



\## Deployment



\### Frontend



\* Vercel

\* Netlify



\### Backend



\* Render

\* Railway



\### Database



\* MongoDB Atlas



\---



\## Security Features



\* JWT Authentication

\* Password Hashing

\* Secure API Routes

\* Input Validation

\* File Upload Protection



\---



\## License



MIT License



\---



\## Author



Amit Singh



BCA Graduate | Full Stack Developer | AI \& Machine Learning Enthusiast

