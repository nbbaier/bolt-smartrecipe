import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import "./index.css";

// Add error boundary for debugging
class ErrorBoundary extends React.Component {
	constructor(props: any) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: any) {
		return { hasError: true, error };
	}

	componentDidCatch(error: any, errorInfo: any) {
		console.error("React Error Boundary caught an error:", error, errorInfo);
	}

	render() {
		if ((this.state as any).hasError) {
			return (
				<div
					style={{
						padding: "20px",
						textAlign: "center",
						fontFamily: "system-ui, sans-serif",
						color: "#dc2626",
					}}
				>
					<h1>Something went wrong</h1>
					<p>Check the browser console for more details.</p>
					<pre
						style={{
							background: "#f3f4f6",
							padding: "10px",
							borderRadius: "4px",
							textAlign: "left",
							fontSize: "12px",
							overflow: "auto",
						}}
					>
						{(this.state as any).error?.toString()}
					</pre>
				</div>
			);
		}

		return (this.props as any).children;
	}
}

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

try {
	const root = createRoot(rootElement);
	root.render(
		<StrictMode>
			<ErrorBoundary>
				<App />
			</ErrorBoundary>
		</StrictMode>,
	);
} catch (error) {
	console.error("Failed to render app:", error);
	rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: system-ui, sans-serif; color: #dc2626;">
      <h1>Failed to load SmartRecipe</h1>
      <p>Check the browser console for error details.</p>
    </div>
  `;
}
