// Shows every error message on its own line.
export default function ErrorList({ errors }) {
  if (!errors?.length) return null;
  return (
    <div className="error" role="alert">
      {errors.map((message) => <p key={message}>{message}</p>)}
    </div>
  );
}
