# Restauria 🍽️

Restauria is a modern restaurant management system built with Next.js, Supabase, and Tailwind CSS. It provides a seamless experience for managers, waiters, kitchen staff, and customers (via tablet-based ordering).

## 🚀 Features

- **Multi-Role Dashboards**: Specific views for Managers, Waiters, and Kitchen staff.
- **Real-time Updates**: Powered by Supabase Realtime subscriptions (orders, table status).
- **Tablet Ordering System**: Customers can order directly from their table.
- **Order Flow**:
  - Tablet: Place order -> `IN_KITCHEN`
  - Kitchen: Prepare -> `COMPLETED`
  - Waiter: Serve -> `SERVED`
  - Manager: Checkout/Payment -> `PAID`
- **Analytics**: Manager dashboard with daily revenue, order stats, and active table monitoring.
- **Robust Testing**: Comprehensive test suite using Vitest and React Testing Library.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🧪 Testing

The project includes 31 unit and integration tests covering core business logic and UI components.

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Key Areas Tested

- **Cart Logic**: Add, remove, update quantities, and total calculations.
- **Auth**: Role-based access control, session management, and redirection.
- **Manager Dashboard**: Revenue statistics, active sessions, and multi-order accumulation.
- **Waiter Dashboard**: Order tracking and service state management.
- **Kitchen Dashboard**: FIFO order processing and item-level status updates.

## 🛠️ Setup & Development

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/app`: Page components and routing.
- `src/components`: Reusable UI components.
- `src/context`: React Contexts for global state (Auth, Cart).
- `src/lib`: Supabase client and utility functions.
- `src/types`: TypeScript definitions and database schema types.
- `src/**/__tests__`: Test files for each module.

## 📝 License

Developed as part of a high-performance restaurant automation project.
