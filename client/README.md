# Client — React Frontend

The frontend is a single-page application (SPA) built with React 19, Vite, and TailwindCSS.

## Structure

```
src/
├── pages/                  # Route components (one per page)
│   ├── home.tsx           # Landing page
│   ├── tool.tsx           # Main giveaway picker tool
│   ├── analytics.tsx      # Statistics dashboard
│   ├── schedule.tsx       # Scheduled giveaway results page
│   └── ...                # Auth, static pages, etc.
│
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components (imported from Radix)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout.tsx        # Main layout wrapper
│   ├── AdBanner.tsx      # Google AdSense banner
│   ├── seo.tsx           # SEO/meta tags
│   ├── checkout-form.tsx # Stripe payment form
│   └── ...               # Other shared components
│
├── hooks/                # Custom React hooks
│   ├── use-user.ts       # Auth context hook
│   ├── use-toast.ts      # Toast notifications
│   └── use-mobile.ts     # Mobile detection
│
├── lib/                  # Utilities and helpers
│   ├── stripe.ts         # Stripe.js initialization
│   ├── queryClient.ts    # React Query config
│   ├── utils.ts          # General utilities
│   └── protected-route.tsx # Auth wrapper component
│
├── assets/               # Images and static files
│   └── hero-giveaway.png
│
├── App.tsx               # Root component with Wouter routes
├── main.tsx              # React entry point
└── index.css             # Global styles + Tailwind imports

public/                    # Static files served as-is
└── index.html            # HTML entry point
```

## Key Patterns

### Components

All components are functional with hooks. Example:

```tsx
interface Props {
  label: string;
  onChange: (value: string) => void;
}

export function MyInput({ label, onChange }: Props) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div>
      <label>{label}</label>
      <input value={value} onChange={handleChange} />
    </div>
  );
}
```

### State Management

- **Local state:** `useState` for UI state (form inputs, modals, etc.)
- **Server state:** React Query for API calls (automatic caching, refetching)
- **Auth state:** `use-user` hook (reads from session API)
- **Global state:** Not used; keep it simple with props

### Styling

- **TailwindCSS utilities:** Primary method for styling
- **shadcn/ui components:** Copy-pasted from Radix, customized locally
- **Global styles:** `index.css` for animations, utilities, responsive typography
- **No CSS modules:** All styling via Tailwind classes

### Forms

Use **React Hook Form** + **Zod** for validation:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    // ...
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Data Fetching

Use **React Query** for API calls:

```tsx
import { useQuery } from "@tanstack/react-query";

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["giveaways"],
    queryFn: async () => {
      const res = await fetch("/api/giveaways");
      return res.json();
    },
  });

  if (isLoading) return <Loader />;
  if (error) return <Error />;

  return <div>{/* render data */}</div>;
}
```

## Development

### Start Dev Server

```bash
npm run dev             # Backend + frontend together
npm run dev:client      # Frontend only (requires separate backend)
```

### Build

```bash
npm run build          # Production build
npm run check          # TypeScript type checking
```

### Key Files to Modify

- **New page:** Add file to `pages/`, export component, add route to `App.tsx`
- **New component:** Add to `components/`, export from there
- **New hook:** Add to `hooks/`, follow naming convention `use-*`
- **New utility:** Add to `lib/`, export as named function
- **Styling:** Use Tailwind classes in JSX; update `index.css` for global utilities

## Responsive Design

- **Mobile first:** Write styles for mobile, then add `sm:`, `md:`, `lg:` breakpoints
- **Tailwind breakpoints:** sm=640px, md=768px, lg=1024px, xl=1280px
- **Full-bleed sections:** Use `.full-bleed` utility class (in `index.css`)
- **Touch targets:** Min 44px height/width on mobile

## Performance

- **Images:** Use `loading="lazy"` for non-critical images
- **Code splitting:** Vite automatically splits route components
- **Bundle size:** Check with `npm run build` and review output
- **React DevTools:** Use in browser to check component renders

## Common Tasks

### Add a new page

1. Create `client/src/pages/MyPage.tsx`
2. Add route in `client/src/App.tsx`:
   ```tsx
   <Route path="/my-page" component={MyPage} />
   ```
3. Link from navigation if needed

### Add form validation

1. Define Zod schema in component or `shared/schema.ts`
2. Use with React Hook Form resolver
3. Display errors next to fields

### Call an API

```tsx
const { data } = useQuery({
  queryKey: ["endpoint"],
  queryFn: async () => {
    const res = await fetch("/api/endpoint");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
});
```

### Show a toast notification

```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

toast({
  title: "Success!",
  description: "Your action completed.",
  variant: "default", // or "destructive"
});
```

### Check authentication

```tsx
import { useUser } from "@/hooks/use-user";

function MyComponent() {
  const { user, loading } = useUser();

  if (!user) return <Redirect to="/login" />;

  return <div>Logged in as {user.email}</div>;
}
```
