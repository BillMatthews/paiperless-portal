export default function Home() {
  return (
    <div className="flex flex-col items-center p-8 sm:p-20">
      
      <main className="flex flex-col items-center w-full max-w-4xl gap-10 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-center">Welcome to the Paiperless Trade Portal Dashboard</h1>
        <p className="text-muted-foreground text-center mb-8 max-w-2xl">
          Use the navigation on the left to access different sections of the platform. Each section helps you manage a key area of the business.
        </p>
      </main>
    </div>
  );
}
