import { logout } from '@/app/auth/actions';

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
      >
        Log out
      </button>
    </form>
  );
}
