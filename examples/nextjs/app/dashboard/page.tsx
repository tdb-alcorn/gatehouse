import { Gate } from "gatehouse/react";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Anyone authenticated sees this */}
      <section>
        <h2>Projects</h2>
        <p>Your projects will appear here.</p>
      </section>

      {/* Only users with project:create permission */}
      <Gate allow="project:create">
        <button>New Project</button>
      </Gate>

      {/* Admin+ only */}
      <Gate role="admin">
        <section>
          <h2>Team Settings</h2>
          <p>Manage members and permissions.</p>
        </section>
      </Gate>

      {/* Owner only, with fallback */}
      <Gate role="owner" fallback={<p>Only the workspace owner can manage billing.</p>}>
        <section>
          <h2>Billing</h2>
          <p>Manage your subscription.</p>
        </section>
      </Gate>
    </div>
  );
}
