---
name: Bartosz Golebiowski
avatar: /static/avatar.png
occupation: Solution architect
company: Bartosz golebiowski bargol usługi it
email: bartosz.golebiowski24@gmail.com
twitter: https://twitter.com/BartoszEbiowski
linkedin: https://www.linkedin.com/in/bartosz-go%C5%82%C4%99biowski-12723a159/
github: https://github.com/bartoszgolebiowski
---

I solve tough problems.

—

I am a solution architect for a few related software products. I have been in the IT industry for over 7 years.

Portfolio:

![Translation service workflow](/blog/portfolio/translation-service.png)  
**Title**: Dynamic Translation Management Service  
**My role**: Designed the overall architecture and technical solution.  
**Project description**: Dynamic Translation Service  
**Purpose**: Enables users to update or import translations dynamically.  
**Key Features**:  
- Users can update translations via UI, making changes accessible to all users for a specific language.
- It supports importing complete CSV for seamless rollout of translations.

**Technology Stack**:  
- Frontend: Built with React.
- Storage: Translation assets stored in Amazon S3.
- Caching: Assets are cached via CloudFront for optimized delivery.
- Integration:
- AWS Cognito and AWS Amplify are used for S3 integration from the UI.

**Skills and deliverables**:  
- React
- Amazon S3
- AWS CloudFront
- AWS Amplify
- CSV

---

![Pipelines](/blog/portfolio/pipelines.png)  
**Title**: Trunk-Based Development with CI/CD Using Jenkins  
**My role**: Architect and executor of the design  
**Project description**: Trunk-Based Development with CI/CD Using Jenkins  
**Workflow**:  
- Trunk-based development with branching, commit rules, and feature flags.

**CI/CD Pipelines**:  
- CI: Automated testing, artifact creation, GitHub integration, artifact  publishing, tagging, and pushing to the remote repository.
- CD: Dedicated pipeline for deploying released versions.

**Artifacts**:  
- Created once and reused across all environments.

**Configuration**:  
- Managed via configuration files and environment variables.

**Skills and deliverables**:  
- Jenkins
- Git
- GitHub
- Docker

---

![Step function](/blog/portfolio/step-functions.png)  
**Title**: Async integration from Kubernetes with AWS Step function via SQS  
**My role**: Responsible for designing and implementing functionality based on business requirements  
**Project description**: Complex import functionality.  

**Kubernetes Application**:  
- Publishes an event to initialize the data import functionality.  

**Event Bus**:  
- Receives the event, allowing for scalable consumer additions.  

**SQS Listener**:  
- Listens to event bus emissions and triggers the Step Function.  

**Step Function Workflow**:  
- Purpose: Long-running process with ~15-20 blocks:
- S3: Reads data.
- DynamoDB: Tracks flow status and shares process updates.
- SQS with Task Tokens: Enables synchronous communication with Kubernetes
- Lambdas: Handles custom logic for specific tasks.

**Skills and deliverables**:  
- AWS Lambda
- Amazon DynamoDB
- Kubernetes
- Amazon S3
