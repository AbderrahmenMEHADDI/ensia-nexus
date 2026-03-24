import type { User, Student, Teacher, ResearchLab, ResearchGroup, GroupMember, Project, ProjectParticipant, ProjectApplication, Task, TaskUpdate, ProjectResource, ChatRoom, ChatMessage, GroupJoinRequest, Announcement } from '@/types';

export const users: User[] = [
  { id: 1, full_name: 'Dr. Amina Belkacem', email: 'a.belkacem@ensia.edu.dz', role: 'TEACHER', created_at: '2023-01-15' },
  { id: 2, full_name: 'Prof. Karim Hadj', email: 'k.hadj@ensia.edu.dz', role: 'TEACHER', created_at: '2023-02-01' },
  { id: 3, full_name: 'Yasmine Cherifi', email: 'y.cherifi@ensia.edu.dz', role: 'STUDENT', created_at: '2024-09-01' },
  { id: 4, full_name: 'Mohamed Ait Said', email: 'm.aitsaid@ensia.edu.dz', role: 'STUDENT', created_at: '2024-09-01' },
  { id: 5, full_name: 'Fatima Zahra Bouzid', email: 'f.bouzid@ensia.edu.dz', role: 'ADMIN', created_at: '2022-06-01' },
  { id: 6, full_name: 'Rachid Mebarki', email: 'r.mebarki@ensia.edu.dz', role: 'TEACHER', created_at: '2023-05-10' },
  { id: 7, full_name: 'Lina Touati', email: 'l.touati@ensia.edu.dz', role: 'STUDENT', created_at: '2024-09-01' },
  { id: 8, full_name: 'Prof. Nadia Rahmani', email: 'n.rahmani@ensia.edu.dz', role: 'TEACHER', created_at: '2023-03-01' },
  { id: 9, full_name: 'Sofiane Khelifi', email: 's.khelifi@ensia.edu.dz', role: 'STUDENT', created_at: '2024-09-01' },
  { id: 10, full_name: 'Dr. Youcef Merad', email: 'y.merad@ensia.edu.dz', role: 'TEACHER', created_at: '2023-01-20' },
];

export const students: Student[] = [
  { user_id: 3, university: 'ENSIA', level: 'Master 2', major: 'Artificial Intelligence', created_at: '2024-09-01' },
  { user_id: 4, university: 'ENSIA', level: 'Master 1', major: 'Data Science', created_at: '2024-09-01' },
  { user_id: 7, university: 'ENSIA', level: 'Master 2', major: 'Cybersecurity', created_at: '2024-09-01' },
  { user_id: 9, university: 'ENSIA', level: 'License 3', major: 'Software Engineering', created_at: '2024-09-01' },
];

export const teachers: Teacher[] = [
  { user_id: 1, experience_years: 15, grade: 'DOCTOR', department: 'Computer Science', research_interests: 'NLP, Deep Learning, Transformers', created_at: '2023-01-15' },
  { user_id: 2, experience_years: 20, grade: 'PROFESSOR', department: 'Mathematics & AI', research_interests: 'Optimization, Reinforcement Learning', created_at: '2023-02-01' },
  { user_id: 6, experience_years: 5, grade: 'MCA', department: 'Computer Science', research_interests: 'Computer Vision, Medical Imaging', created_at: '2023-05-10' },
  { user_id: 8, experience_years: 18, grade: 'PROFESSOR', department: 'Data Science', research_interests: 'Big Data, Distributed Systems, Stream Processing', created_at: '2023-03-01' },
  { user_id: 10, experience_years: 12, grade: 'DOCTOR', department: 'Cybersecurity', research_interests: 'Cryptography, Blockchain, Zero-Knowledge Proofs', created_at: '2023-01-20' },
];

export const researchLabs: ResearchLab[] = [
  { id: 1, name: 'LRIA — Laboratoire de Recherche en Intelligence Artificielle', description: 'Advancing AI research with focus on NLP, computer vision, and reinforcement learning applied to real-world problems.', head_teacher_id: 1, created_at: '2023-03-01' },
  { id: 2, name: 'LCSI — Lab for Cybersecurity & Systems Intelligence', description: 'Research in cryptographic protocols, blockchain systems, and intelligent security frameworks.', head_teacher_id: 10, created_at: '2023-04-01' },
  { id: 3, name: 'LDSA — Lab for Data Science & Analytics', description: 'Exploring big data architectures, stream processing, and data-driven decision systems.', head_teacher_id: 8, created_at: '2023-05-01' },
];

export const researchGroups: ResearchGroup[] = [
  { id: 1, lab_id: 1, name: 'NLP & Language Understanding', description: 'Focused on Arabic NLP, sentiment analysis, and language model fine-tuning.', leader_user_id: 1, is_validated: true, validated_by_admin_id: 5, validated_at: '2023-04-01', created_at: '2023-03-15' },
  { id: 2, lab_id: 1, name: 'Vision & Medical Imaging', description: 'Applying deep learning to medical image analysis and diagnostic systems.', leader_user_id: 6, is_validated: true, validated_by_admin_id: 5, validated_at: '2023-06-01', created_at: '2023-05-20' },
  { id: 3, lab_id: 2, name: 'Blockchain & Trust Systems', description: 'Developing decentralized trust frameworks and zero-knowledge proof applications.', leader_user_id: 10, is_validated: true, validated_by_admin_id: 5, validated_at: '2023-06-15', created_at: '2023-06-01' },
  { id: 4, lab_id: 3, name: 'Real-Time Analytics', description: 'Building stream processing pipelines for real-time data analysis.', leader_user_id: 8, is_validated: false, created_at: '2024-01-10' },
  { id: 5, lab_id: 1, name: 'Reinforcement Learning', description: 'Exploring RL for robotics and game-playing agents.', leader_user_id: 2, is_validated: true, validated_by_admin_id: 5, validated_at: '2023-07-01', created_at: '2023-06-20' },
];

export const groupMembers: GroupMember[] = [
  { group_id: 1, user_id: 1, is_active: true, joined_at: '2023-03-15' },
  { group_id: 1, user_id: 3, is_active: true, joined_at: '2024-09-15' },
  { group_id: 1, user_id: 4, is_active: true, joined_at: '2024-10-01' },
  { group_id: 2, user_id: 6, is_active: true, joined_at: '2023-05-20' },
  { group_id: 2, user_id: 7, is_active: true, joined_at: '2024-09-20' },
  { group_id: 3, user_id: 10, is_active: true, joined_at: '2023-06-01' },
  { group_id: 3, user_id: 9, is_active: true, joined_at: '2024-10-15' },
  { group_id: 5, user_id: 2, is_active: true, joined_at: '2023-06-20' },
  { group_id: 5, user_id: 4, is_active: true, joined_at: '2024-11-01' },
];

export const projects: Project[] = [
  { id: 1, group_id: 1, title: 'Arabic Sentiment Analysis on Social Media', description: 'Building a fine-tuned BERT model for Algerian Arabic dialect sentiment analysis on Twitter/X data.', visibility: 'PUBLIC', created_by: 1, created_at: '2024-01-15' },
  { id: 2, group_id: 2, title: 'Retinal Disease Detection via Fundus Imaging', description: 'Deep learning pipeline for automated detection of diabetic retinopathy from retinal fundus photographs.', visibility: 'PUBLIC', created_by: 6, created_at: '2024-02-01' },
  { id: 3, group_id: 3, title: 'Zero-Knowledge Identity Verification', description: 'A privacy-preserving identity verification system using zk-SNARKs on Ethereum.', visibility: 'PRIVATE', created_by: 10, created_at: '2024-03-01' },
  { id: 4, group_id: 5, title: 'Multi-Agent RL for Traffic Optimization', description: 'Using multi-agent reinforcement learning to optimize urban traffic flow in Algiers.', visibility: 'PUBLIC', created_by: 2, created_at: '2024-04-01' },
  { id: 5, group_id: 1, title: 'Automated Academic Paper Summarization', description: 'An NLP system that generates concise summaries of academic papers using extractive and abstractive methods.', visibility: 'PUBLIC', created_by: 1, created_at: '2024-06-01' },
];

export const projectParticipants: ProjectParticipant[] = [
  { project_id: 1, user_id: 1, participant_role: 'LEAD', joined_at: '2024-01-15' },
  { project_id: 1, user_id: 3, participant_role: 'MEMBER', joined_at: '2024-01-20' },
  { project_id: 1, user_id: 4, participant_role: 'MEMBER', joined_at: '2024-02-01' },
  { project_id: 2, user_id: 6, participant_role: 'LEAD', joined_at: '2024-02-01' },
  { project_id: 2, user_id: 7, participant_role: 'MEMBER', joined_at: '2024-02-15' },
  { project_id: 3, user_id: 10, participant_role: 'LEAD', joined_at: '2024-03-01' },
  { project_id: 3, user_id: 9, participant_role: 'MEMBER', joined_at: '2024-03-10' },
  { project_id: 4, user_id: 2, participant_role: 'LEAD', joined_at: '2024-04-01' },
  { project_id: 4, user_id: 4, participant_role: 'MEMBER', joined_at: '2024-04-15' },
  { project_id: 5, user_id: 1, participant_role: 'LEAD', joined_at: '2024-06-01' },
  { project_id: 5, user_id: 3, participant_role: 'REVIEWER', joined_at: '2024-06-10' },
];

export const projectApplications: ProjectApplication[] = [
  { id: 1, project_id: 1, student_user_id: 7, motivation: 'I am deeply interested in Arabic NLP and have completed coursework in transformer architectures. I would love to contribute to this project.', status: 'PENDING', created_at: '2024-11-01' },
  { id: 2, project_id: 4, student_user_id: 9, motivation: 'RL is my primary research interest. I have implemented PPO and A3C agents in my coursework and want to apply these in real-world scenarios.', status: 'ACCEPTED', reviewed_by: 2, reviewed_at: '2024-11-05', decision_note: 'Strong background in RL fundamentals.', created_at: '2024-10-20' },
  { id: 3, project_id: 2, student_user_id: 3, motivation: 'I want to explore medical AI applications. Although my main focus is NLP, I believe cross-domain experience will strengthen my research profile.', status: 'REJECTED', reviewed_by: 6, reviewed_at: '2024-11-10', decision_note: 'We need candidates with CV/medical imaging background for this cycle.', created_at: '2024-10-25' },
  { id: 4, project_id: 5, student_user_id: 4, motivation: 'Summarization is at the intersection of my interests in both NLP and information retrieval. I have experience with T5 and PEGASUS models.', status: 'PENDING', created_at: '2024-12-01' },
];

export const tasks: Task[] = [
  { id: 1, project_id: 1, title: 'Collect Twitter dataset', description: 'Scrape and clean 50k Algerian dialect tweets for training data.', status: 'DONE', priority: 'HIGH', created_by: 1, assignee_user_id: 3, due_date: '2024-03-01', created_at: '2024-01-20', updated_at: '2024-02-28' },
  { id: 2, project_id: 1, title: 'Fine-tune DziriBERT', description: 'Fine-tune the DziriBERT model on our collected dataset.', status: 'IN_PROGRESS', priority: 'HIGH', created_by: 1, assignee_user_id: 3, due_date: '2024-04-15', created_at: '2024-03-01', updated_at: '2024-03-20' },
  { id: 3, project_id: 1, title: 'Build evaluation pipeline', description: 'Create automated evaluation with F1, accuracy, and confusion matrices.', status: 'TODO', priority: 'MEDIUM', created_by: 1, assignee_user_id: 4, due_date: '2024-05-01', created_at: '2024-03-01', updated_at: '2024-03-01' },
  { id: 4, project_id: 1, title: 'Write literature review', description: 'Survey existing Arabic sentiment analysis approaches.', status: 'DONE', priority: 'MEDIUM', created_by: 1, assignee_user_id: 4, due_date: '2024-02-15', created_at: '2024-01-20', updated_at: '2024-02-10' },
  { id: 5, project_id: 1, title: 'Deploy demo API', description: 'Create FastAPI endpoint for real-time sentiment prediction.', status: 'TODO', priority: 'LOW', created_by: 1, assignee_user_id: 3, due_date: '2024-06-01', created_at: '2024-03-15', updated_at: '2024-03-15' },
  { id: 6, project_id: 2, title: 'Preprocess fundus images', description: 'Resize, normalize, and augment the retinal image dataset.', status: 'IN_PROGRESS', priority: 'HIGH', created_by: 6, assignee_user_id: 7, due_date: '2024-04-01', created_at: '2024-02-05', updated_at: '2024-03-10' },
  { id: 7, project_id: 2, title: 'Train ResNet classifier', description: 'Train a ResNet-50 model on preprocessed fundus images.', status: 'BLOCKED', priority: 'URGENT', created_by: 6, assignee_user_id: 7, due_date: '2024-05-01', created_at: '2024-02-10', updated_at: '2024-03-15' },
  { id: 8, project_id: 3, title: 'Implement zk-SNARK circuits', description: 'Design and implement zero-knowledge proof circuits for identity attributes.', status: 'IN_PROGRESS', priority: 'URGENT', created_by: 10, assignee_user_id: 9, due_date: '2024-05-15', created_at: '2024-03-05', updated_at: '2024-04-01' },
  { id: 9, project_id: 4, title: 'Set up SUMO simulator', description: 'Configure SUMO traffic simulator with Algiers map data.', status: 'DONE', priority: 'HIGH', created_by: 2, assignee_user_id: 4, due_date: '2024-05-01', created_at: '2024-04-05', updated_at: '2024-04-28' },
  { id: 10, project_id: 4, title: 'Implement MAPPO agent', description: 'Code the Multi-Agent PPO algorithm for traffic signal control.', status: 'IN_PROGRESS', priority: 'HIGH', created_by: 2, assignee_user_id: 4, due_date: '2024-06-15', created_at: '2024-05-01', updated_at: '2024-05-20' },
  { id: 11, project_id: 5, title: 'Build extractive summarizer', description: 'Implement TextRank-based extractive summarization baseline.', status: 'TODO', priority: 'MEDIUM', created_by: 1, due_date: '2024-08-01', created_at: '2024-06-05', updated_at: '2024-06-05' },
  { id: 12, project_id: 1, title: 'Prepare conference paper draft', description: 'Write first draft targeting EMNLP submission.', status: 'CANCELLED', priority: 'LOW', created_by: 1, assignee_user_id: 3, due_date: '2024-07-01', created_at: '2024-04-01', updated_at: '2024-05-01' },
];

export const taskUpdates: TaskUpdate[] = [
  { id: 1, task_id: 1, author_user_id: 3, note: 'Collected 30k tweets using snscrape. Cleaning in progress.', hours_added: 8, new_status: 'IN_PROGRESS', new_progress: 60, created_at: '2024-02-10' },
  { id: 2, task_id: 1, author_user_id: 3, note: 'Dataset complete. 48.2k cleaned tweets with manual annotation for 5k samples.', hours_added: 12, new_status: 'DONE', new_progress: 100, created_at: '2024-02-28' },
  { id: 3, task_id: 2, author_user_id: 3, note: 'Started fine-tuning with learning rate 2e-5. First epoch results look promising.', hours_added: 6, new_status: 'IN_PROGRESS', new_progress: 30, created_at: '2024-03-15' },
  { id: 4, task_id: 6, author_user_id: 7, note: 'Preprocessing pipeline complete for 8k images. Augmentation next.', hours_added: 10, new_status: 'IN_PROGRESS', new_progress: 50, created_at: '2024-03-10' },
  { id: 5, task_id: 7, author_user_id: 7, note: 'Blocked: GPU cluster maintenance until March 20th.', hours_added: 0, new_status: 'BLOCKED', new_progress: 0, created_at: '2024-03-15' },
];

export const projectResources: ProjectResource[] = [
  { id: 1, project_id: 1, resource_type: 'GIT_REPO', title: 'Arabic Sentiment Repo', url: 'https://github.com/ensia-lab/arabic-sentiment', created_by: 1, created_at: '2024-01-20' },
  { id: 2, project_id: 1, resource_type: 'DATASET', title: 'Algerian Tweets Dataset v1', url: 'https://huggingface.co/datasets/ensia/dz-tweets', created_by: 3, created_at: '2024-02-28' },
  { id: 3, project_id: 1, resource_type: 'PAPER_DOC', title: 'DziriBERT: Pre-trained Model for Algerian Dialect', url: 'https://arxiv.org/abs/2109.12346', created_by: 1, created_at: '2024-01-15' },
  { id: 4, project_id: 2, resource_type: 'GIT_REPO', title: 'Retinal Detection Pipeline', url: 'https://github.com/ensia-lab/retinal-detect', created_by: 6, created_at: '2024-02-05' },
  { id: 5, project_id: 2, resource_type: 'DATASET', title: 'APTOS 2019 Blindness Detection', url: 'https://kaggle.com/competitions/aptos2019', created_by: 7, created_at: '2024-02-10' },
  { id: 6, project_id: 3, resource_type: 'GIT_REPO', title: 'ZK Identity Contracts', url: 'https://github.com/ensia-lab/zk-identity', created_by: 10, created_at: '2024-03-05' },
  { id: 7, project_id: 4, resource_type: 'PAPER_DOC', title: 'MAPPO: Multi-Agent PPO', url: 'https://arxiv.org/abs/2103.01955', created_by: 2, created_at: '2024-04-01' },
];

// Helper to get user by ID
export const getUserById = (id: number) => users.find(u => u.id === id);
export const getStudentByUserId = (id: number) => students.find(s => s.user_id === id);
export const getTeacherByUserId = (id: number) => teachers.find(t => t.user_id === id);
export const getLabById = (id: number) => researchLabs.find(l => l.id === id);
export const getGroupById = (id: number) => researchGroups.find(g => g.id === id);
export const getProjectById = (id: number) => projects.find(p => p.id === id);
export const getGroupsByLab = (labId: number) => researchGroups.filter(g => g.lab_id === labId);
export const getMembersByGroup = (groupId: number) => groupMembers.filter(m => m.group_id === groupId);
export const getProjectsByGroup = (groupId: number) => projects.filter(p => p.group_id === groupId);
export const getTasksByProject = (projectId: number) => tasks.filter(t => t.project_id === projectId);
export const getParticipantsByProject = (projectId: number) => projectParticipants.filter(p => p.project_id === projectId);
export const getResourcesByProject = (projectId: number) => projectResources.filter(r => r.project_id === projectId);
export const getApplicationsByProject = (projectId: number) => projectApplications.filter(a => a.project_id === projectId);

// Current user simulation
export const currentUser = users[0]; // Dr. Amina Belkacem (TEACHER)

// Group join requests
export const groupJoinRequests: GroupJoinRequest[] = [
  { id: 1, group_id: 1, user_id: 9, message: 'I want to contribute to Arabic NLP research. I have experience with transformer models.', status: 'PENDING', created_at: '2024-12-01' },
  { id: 2, group_id: 2, user_id: 4, message: 'Interested in medical imaging. I have completed a course on computer vision.', status: 'PENDING', created_at: '2024-12-05' },
  { id: 3, group_id: 3, user_id: 7, message: 'I want to explore blockchain and cryptography applications.', status: 'ACCEPTED', reviewed_by: 10, reviewed_at: '2024-12-10', created_at: '2024-12-02' },
];

export const getJoinRequestsByGroup = (groupId: number) => groupJoinRequests.filter(r => r.group_id === groupId);

// Chat rooms
export const chatRooms: ChatRoom[] = [
  { id: 1, name: 'General', type: 'TEAM', created_at: '2024-01-01' },
  { id: 2, name: 'Announcements', type: 'TEAM', created_at: '2024-01-01' },
  { id: 3, name: 'Arabic Sentiment — General', type: 'PROJECT', project_id: 1, created_at: '2024-01-20' },
  { id: 4, name: 'Arabic Sentiment — Data Pipeline', type: 'PROJECT', project_id: 1, created_at: '2024-02-01' },
  { id: 5, name: 'Retinal Detection — General', type: 'PROJECT', project_id: 2, created_at: '2024-02-01' },
  { id: 6, name: 'ZK Identity — General', type: 'PROJECT', project_id: 3, created_at: '2024-03-01' },
  { id: 7, name: 'Traffic RL — General', type: 'PROJECT', project_id: 4, created_at: '2024-04-01' },
  { id: 8, name: 'Paper Summarization — General', type: 'PROJECT', project_id: 5, created_at: '2024-06-01' },
];

export const chatMessages: ChatMessage[] = [
  { id: 1, room_id: 1, sender_user_id: 5, content: 'Welcome to the ENSIA Research Hub! Please use this channel for general discussions.', created_at: '2024-01-01T09:00:00' },
  { id: 2, room_id: 1, sender_user_id: 1, content: 'Thanks! Excited to collaborate here.', created_at: '2024-01-01T09:15:00' },
  { id: 3, room_id: 1, sender_user_id: 3, content: 'Hello everyone! Looking forward to working on the NLP project.', created_at: '2024-01-02T10:00:00' },
  { id: 4, room_id: 1, sender_user_id: 2, content: 'Great to see the platform up and running.', created_at: '2024-01-02T14:30:00' },
  { id: 5, room_id: 2, sender_user_id: 5, content: 'Reminder: All group proposals must be submitted by end of month.', created_at: '2024-01-15T08:00:00' },
  { id: 6, room_id: 3, sender_user_id: 1, content: 'Let\'s discuss the data collection strategy for the Twitter scraping.', created_at: '2024-01-20T11:00:00' },
  { id: 7, room_id: 3, sender_user_id: 3, content: 'I can handle the snscrape setup. Should we filter by specific hashtags?', created_at: '2024-01-20T11:15:00' },
  { id: 8, room_id: 3, sender_user_id: 1, content: 'Yes, focus on Algerian dialect hashtags. I\'ll share a list.', created_at: '2024-01-20T11:20:00' },
  { id: 9, room_id: 3, sender_user_id: 4, content: 'I can help with annotation once we have the dataset.', created_at: '2024-01-20T14:00:00' },
  { id: 10, room_id: 4, sender_user_id: 3, content: 'Data pipeline v1 is ready. Processing ~2k tweets/min.', created_at: '2024-02-10T16:00:00' },
  { id: 11, room_id: 5, sender_user_id: 6, content: 'APTOS dataset downloaded. Starting preprocessing tomorrow.', created_at: '2024-02-05T17:00:00' },
  { id: 12, room_id: 5, sender_user_id: 7, content: 'Great! I\'ll set up the augmentation pipeline.', created_at: '2024-02-05T17:30:00' },
  { id: 13, room_id: 7, sender_user_id: 2, content: 'SUMO simulator is configured. Let\'s start with a simple intersection scenario.', created_at: '2024-04-10T09:00:00' },
  { id: 14, room_id: 7, sender_user_id: 4, content: 'On it. I\'ll implement the basic PPO agent first.', created_at: '2024-04-10T09:30:00' },
];

export const announcements: Announcement[] = [
  {
    id: 1,
    title: 'New Paper Accepted at EMNLP 2024',
    content: 'Our research on Algerian Arabic Dialect sentiment analysis has been accepted at EMNLP 2024. Congratulations to Dr. Amina and the NLP group!',
    author_user_id: 1,
    created_at: '2024-11-20T10:00:00',
    category: 'RESEARCH',
    tags: ['NLP', 'EMNLP', 'Success'],
  },
  {
    id: 2,
    title: 'NVIDIA GPU Cluster Upgrade',
    content: 'The laboratory GPU cluster will be undergoing maintenance and upgrade this weekend. We are adding 4 new A100 nodes.',
    author_user_id: 5,
    created_at: '2024-11-22T14:30:00',
    category: 'ADMIN',
    tags: ['Infrastructure', 'Maintenance'],
  },
  {
    id: 3,
    title: 'Research Seminar: Zero-Knowledge Proofs',
    content: 'Join us next Wednesday for a seminar on the latest advancements in ZK-SNARKs and their application in identity management.',
    author_user_id: 10,
    created_at: '2024-12-01T09:00:00',
    category: 'EVENT',
    tags: ['Cryptography', 'Seminar'],
  },
];

export const getChatRoomById = (id: number) => chatRooms.find(r => r.id === id);
export const getMessagesByRoom = (roomId: number) => chatMessages.filter(m => m.room_id === roomId);
export const getChatRoomsByProject = (projectId: number) => chatRooms.filter(r => r.project_id === projectId);
export const getTeamChatRooms = () => chatRooms.filter(r => r.type === 'TEAM');
