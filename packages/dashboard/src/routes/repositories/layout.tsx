import { component$, Slot, useVisibleTask$, useSignal } from "@builder.io/qwik";
import { useSession } from "~/routes/plugin@auth.ts";
import { useNavigate } from "@builder.io/qwik-city";
import { Skeleton } from "~/components/design-system";

export default component$(() => {
  const session = useSession();
  const navigate = useNavigate();
  const isLoading = useSignal(true);
  const error = useSignal<string | null>(null);

  // Check for session and redirect if not authenticated
  useVisibleTask$(() => {
    try {
      // Check if session exists and has a user
      if (!session.value?.user) {
        navigate("/");
        return;
      }

      // Check if access token is available
      if (!session.value.user.accessToken) {
        error.value = "Authentication token not available";
        return;
      }

      // Session is valid
      isLoading.value = false;
    } catch (err) {
      error.value = "Authentication error occurred";
      console.error("Session check error:", err);
    }
  });

  // Show loading state
  if (isLoading.value) {
    return (
      <div class="p-4 bg-gray-900 text-gray-100 min-h-screen">
        <Skeleton class="h-8 w-full mb-4 bg-gray-800" />
        <Skeleton class="h-32 w-full bg-gray-800" />
      </div>
    );
  }

  // Show error state
  if (error.value) {
    return (
      <div class="p-4 text-red-500 bg-gray-900 min-h-screen">
        <h2 class="text-xl font-bold mb-2">Authentication Error</h2>
        <p>{error.value}</p>
        <button
          type="button"
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick$={() => navigate("/")}
        >
          Return to Home
        </button>
      </div>
    );
  }

  // Only render children if authenticated
  return session.value?.user ? <Slot /> : null;
});
