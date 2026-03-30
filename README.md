# Margins: Contextual Knowledge Reading Platform

**Where smart people read together.**

## 📖 About The Project

**Margins** is a web-based knowledge platform where intellectual discourse happens directly inside the text you are reading. Instead of leaving disconnected comments at the absolute bottom of a page where context is lost, conversations on Margins are anchored precisely to specific paragraphs and sentences. 

This project was built to address a major flaw in modern internet discussion platforms: **participation alone does not guarantee value**. A thousand reactions produce very little understanding if the system rewards immediacy. Margins intentionally adds "friction" to the reading process—you cannot read what others think until you've spent an appropriate amount of time reading the passage yourself. Voice on this platform is earned through demonstrated depth and reading effort, not follower counts.

### Problems It Solves:
1. **Disconnected Discourse:** Prevents the classic "bottom-of-the-page void" where comments lose all connection to the specific claims of the article.
2. **Performative Hot-takes:** Uses a *Reading Gate Feature* (tracking reading depth and duration dynamically) to prevent users from rushing straight to the comment section to argue. You must read the text before you converse.
3. **Information Overload:** Automatically ranks the popularity of ideas on the page. Paragraphs feature a visual heat-map, letting readers know immediately which passages attracted the most intense analysis or debate.

---

## 🚀 How Users Use the Website

1. **Read & Engage:** When you load an article, a timeline at the top tracks your scrolling depth and reading duration. The platform actively monitors if you've earned the right to engage. Check the "In the Margins" column to your right to see your status!
2. **Highlighting:** As you read, simply highlight any interesting sentence or phrase on the screen. A tooltip will appear asking if you'd like to "Add to Margins."
3. **Choose Your Annotation Type:** When adding your annotation, you categorize your thought precisely:
   - 💡 **Insight** — Extracting new angles.
   - ❓ **Question** — Genuine curiosity or requests for clarification.
   - ⚔️ **Challenge** — Politely disagreeing with the reasoning.
   - 🔗 **Connection** — Linking abstract concepts to related fields.
4. **Submit Anonymously/Publicly:** Share your thoughts. They will instantly appear anchored next to the paragraph you were reading.
5. **Threaded Replies:** Click on anyone's existing annotation in the margin to respond directly to their interpretation, creating a permanent nested thread right beside the subject matter.

---

## 🛠 Tech Stack

- **Frontend**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS (v4) + Framer Motion for liquid micro-animations.
- **State Management**: Zustand (using `persist` for native local-storage mockup database).
- **Icons**: Lucide React.
- **Routing**: React Router DOM.
- **Architecture**: Single Page Application (SPA), fully scalable.

---

## 💻 Local Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/suraj-6/dash-margin.git
   cd dash-margin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **For Production Builds:**
   ```bash
   npm run build
   npm run preview
   ```

## 🌐 Deployment (Vercel)

The application is fully compatible with Vercel's SPA routing. 

1. Push your code to your GitHub repository
2. Import the repository straight into [Vercel](https://vercel.com)
3. Ensure the framework preset is set to **Vite**.
4. Deploy!

*(Note: API routes natively require Vercel Serverless Functions (`/api/`) which are built-in without needing Next.js.)*

## 📜 License

MIT License
