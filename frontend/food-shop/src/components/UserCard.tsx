export interface UserCardProps {
  name: string;
  email: string;
  isAdmin?: boolean;
}

export default function UserCard({ name, email, isAdmin = false }: UserCardProps) {
  return (
    <div className="p-4 border rounded shadow-sm bg-white max-w-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-gray-600">{email}</p>
      {isAdmin && (
        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded">
          Admin
        </span>
      )}
    </div>
  );
}
