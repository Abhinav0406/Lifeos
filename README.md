# PromptPolish - Interactive AI Prompt Enhancement

A modern web application that helps users create better AI prompts through interactive questioning and organized folder management.

## Features

- **🔐 User Authentication**: Secure login/signup with Supabase
- **📁 Folder Organization**: Organize prompts by categories (Health, Writing, Coding, etc.)
- **❓ Smart Questioning**: AI generates contextual questions to improve prompts
- **🤖 Multiple AI Providers**: Support for OpenAI, Groq, Gemini, and Hugging Face
- **📚 User-Specific History**: Each user sees only their own prompts and folders
- **🎨 Modern UI**: Clean, responsive design with dark mode support

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Providers**: OpenAI, Groq, Google Gemini, Hugging Face

## Setup Instructions

### 1. Clone and Install Dependencies

   ```bash
git clone <your-repo>
cd AIwrapper
   npm install
   ```

### 2. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to Settings > API to get your project URL and anon key
3. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor

### 3. Configure Environment Variables

Copy `env.example` to `.env.local` and fill in your API keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Provider API Keys (at least one required)
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### 4. Get API Keys

#### OpenAI (Recommended)
- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Free tier available

#### Groq (Fastest - Recommended)
- Go to [Groq Console](https://console.groq.com/keys)
- Create a new API key
- Free tier available

#### Google Gemini
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Free tier available

#### Hugging Face
- Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
- Create a new access token
- Free tier available

### 5. Run the Application

   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## How It Works

### 1. User Authentication
- Users sign up/sign in with email and password
- Each user has their own isolated data

### 2. Folder System
- Create folders for different categories (e.g., "Health", "Writing", "Coding")
- Organize prompts by moving them to specific folders
- View prompts filtered by folder

### 3. Interactive Prompt Enhancement
1. **Input**: User enters a rough prompt
2. **Questions**: AI generates 3-5 contextual questions
3. **Answers**: User provides additional context
4. **Enhancement**: AI creates an improved prompt
5. **Response**: AI generates a response using the enhanced prompt

### 4. History Management
- All prompts are saved to user-specific history
- View, copy, or reload previous prompts
- Clear history when needed

## Database Schema

The application uses two main tables:

### `folders`
- `id`: UUID primary key
- `name`: Folder name
- `description`: Optional description
- `color`: Folder color for UI
- `user_id`: Owner of the folder
- `created_at`, `updated_at`: Timestamps

### `enhancement_results`
- `id`: UUID primary key
- `user_id`: Owner of the result
- `folder_id`: Optional folder assignment
- `original_prompt`: User's original prompt
- `enhanced_prompt`: AI-enhanced prompt
- `ai_response`: AI's response
- `mode`: Enhancement mode (general, writing, coding, etc.)
- `provider`: AI provider used
- `questions_and_answers`: JSON of Q&A session
- `created_at`, `updated_at`: Timestamps

## API Routes

- `POST /api/enhance` - Enhance a prompt and generate AI response
- `POST /api/questions` - Generate contextual questions for a prompt
- `GET /api/folders` - Get user's folders
- `POST /api/folders` - Create a new folder
- `PUT /api/folders` - Update a folder
- `DELETE /api/folders` - Delete a folder
- `GET /api/history` - Get user's prompt history
- `DELETE /api/history` - Delete specific result
- `POST /api/history` - Clear all history

## Folder Categories Examples

- **Health**: Medical questions, fitness prompts, wellness content
- **Writing**: Creative writing, blog posts, stories
- **Coding**: Programming help, debugging, technical questions
- **Marketing**: Sales copy, advertising content, business writing
- **Research**: Academic research, data analysis, information gathering
- **General**: Miscellaneous prompts that don't fit specific categories

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details