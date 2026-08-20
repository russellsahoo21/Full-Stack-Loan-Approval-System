# 🚀 Smart Credit Underwriting & BRE Platform - Postman API Guide

Base Server URL: `http://localhost:5000/api`

---

## 🔑 1. Authentication Endpoints

### 1.1 Register New User
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/register`
- **Headers**: `Content-Type: application/json`

**Sample Request Body (JSON)**:
```json
{
  "name": "Jane Credit Officer",
  "email": "jane@nbfc.com",
  "password": "password123",
  "role": "CREDIT_OFFICER_L1"
}
```

---

### 1.2 User Login (Admin / Officer / Applicant)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/login`
- **Headers**: `Content-Type: application/json`

**Sample Request Body (JSON) - Admin**:
```json
{
  "email": "admin@nbfc.com",
  "password": "admin123"
}
```

**Sample Request Body (JSON) - Officer**:
```json
{
  "email": "officer1@nbfc.com",
  "password": "officer123"
}
```

**Sample Request Body (JSON) - Applicant**:
```json
{
  "email": "rahul@gmail.com",
  "password": "rahul123"
}
```

**Response Snapshot**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66c40a1b...",
    "name": "Policy Admin",
    "email": "admin@nbfc.com",
    "role": "POLICY_ADMIN"
  }
}
```

---

### 1.3 Get Current User Profile
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/auth/me`
- **Headers**: 
  - `Authorization: Bearer <YOUR_JWT_TOKEN>`

---

## 📝 2. Loan Application Endpoints

### 2.1 Submit & Evaluate Loan Application
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/applications/apply`
- **Headers**: `Content-Type: application/json`

**Sample Request Body (JSON) - Rahul Sharma Case (Straight-Through APPROVED)**:
```json
{
  "name": "Rahul Sharma",
  "age": 29,
  "employmentType": "Salaried",
  "declaredMonthlyIncome": 80000,
  "existingEMI": 15000,
  "requestedLoanAmount": 800000,
  "requestedTenureMonths": 60,
  "applicantId": "APP001",
  "cibilScore": 735,
  "writeOffs": 0,
  "bounceCount": 1,
  "mutualFunds": 200000,
  "savings": 50000
}
```

**Sample Request Body (JSON) - Exception Case (CIBIL 680 < 700 but High Assets)**:
```json
{
  "name": "Priya Patel",
  "age": 32,
  "employmentType": "Salaried",
  "declaredMonthlyIncome": 95000,
  "existingEMI": 18000,
  "requestedLoanAmount": 1000000,
  "requestedTenureMonths": 60,
  "cibilScore": 680,
  "writeOffs": 0,
  "bounceCount": 1,
  "mutualFunds": 500000,
  "savings": 100000
}
```

**Sample Request Body (JSON) - Hard Reject Case (Active Write-offs > 0)**:
```json
{
  "name": "Amit Kumar",
  "age": 26,
  "employmentType": "Salaried",
  "declaredMonthlyIncome": 60000,
  "existingEMI": 10000,
  "requestedLoanAmount": 500000,
  "requestedTenureMonths": 36,
  "cibilScore": 650,
  "writeOffs": 1,
  "bounceCount": 4
}
```

---

### 2.2 Get All Applications (Admin & Officers)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/applications/all`
- **Headers**:
  - `Authorization: Bearer <ADMIN_OR_OFFICER_TOKEN>`

---

### 2.3 Get Application Details & Scorecard
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/applications/LOAN1001`
- **Headers**:
  - `Authorization: Bearer <YOUR_JWT_TOKEN>`

---

### 2.4 Re-Evaluate Application Under Specific Rule Version (Demo Proof)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/applications/LOAN1001/evaluate-version/2`
- **Headers**:
  - `Authorization: Bearer <ADMIN_OR_OFFICER_TOKEN>`

---

### 2.5 Credit Officer Exception Decision
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/applications/LOAN1001/exception`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <OFFICER_TOKEN>`

**Sample Request Body (JSON)**:
```json
{
  "action": "APPROVE",
  "officerNotes": "CIBIL score is 680 (below 700 limit), but applicant holds ₹5 Lakhs in Mutual Funds and FOIR is healthy at 38%. Approved via exception."
}
```

---

## ⚙️ 3. Business Rules Engine (BRE) Config Endpoints

### 3.1 Get Active RuleSet
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/rules/active`

---

### 3.2 Get All RuleSet Versions (Policy Admin)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/rules/versions`
- **Headers**:
  - `Authorization: Bearer <ADMIN_TOKEN>`

---

### 3.3 Create & Activate New RuleSet Version (Policy Agility Demo)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/rules/new-version`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <ADMIN_TOKEN>`

**Sample Request Body (JSON) - Creating Version 2 (Increasing Min CIBIL from 700 to 750)**:
```json
{
  "createdReason": "Risk policy update: Raising minimum CIBIL score to 750 for Q3 underwriting tightening",
  "rules": [
    {
      "ruleCode": "R001",
      "description": "Minimum CIBIL Score",
      "parameter": "cibilScore",
      "operator": ">=",
      "threshold": 750,
      "actionOnFail": "HARD_REJECT",
      "mitigatingFactors": ["Assets >= ₹2,000,000"]
    },
    {
      "ruleCode": "R002",
      "description": "Maximum Permissible FOIR",
      "parameter": "foir",
      "operator": "<=",
      "threshold": 50,
      "actionOnFail": "EXCEPTION",
      "mitigatingFactors": ["Mutual Fund Assets >= ₹200,000"]
    },
    {
      "ruleCode": "R003",
      "description": "Minimum Monthly Income",
      "parameter": "monthlyIncome",
      "operator": ">=",
      "threshold": 30000,
      "actionOnFail": "HARD_REJECT"
    },
    {
      "ruleCode": "R004",
      "description": "No Delinquency / Write-offs",
      "parameter": "writeOffs",
      "operator": "==",
      "threshold": 0,
      "actionOnFail": "HARD_REJECT"
    },
    {
      "ruleCode": "R005",
      "description": "Maximum Cheque Bounces",
      "parameter": "bounceCount",
      "operator": "<=",
      "threshold": 2,
      "actionOnFail": "HARD_REJECT"
    },
    {
      "ruleCode": "R006",
      "description": "Minimum Age",
      "parameter": "age",
      "operator": ">=",
      "threshold": 21,
      "actionOnFail": "HARD_REJECT"
    }
  ]
}
```

---

## 📊 4. Synthetic Profile Endpoints

### 4.1 Get Applicant Synthetic Profile
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/synthetic/APP001`

---

### 4.2 Update Synthetic Profile Data
- **Method**: `PUT`
- **URL**: `http://localhost:5000/api/synthetic/APP001`
- **Headers**: `Content-Type: application/json`

**Sample Request Body (JSON)**:
```json
{
  "cibilScore": 760,
  "mutualFunds": 300000,
  "bounceCount": 0
}
```

---

## 🟢 5. System Health Check

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/health`
