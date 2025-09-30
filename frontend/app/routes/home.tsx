import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Bloom - Authentication Learning Tool" },
		{ name: "description", content: "Bloom is an open-source project to show how authentication really works" },
	];
}

export default function Home() {
	return <Welcome />;
}
