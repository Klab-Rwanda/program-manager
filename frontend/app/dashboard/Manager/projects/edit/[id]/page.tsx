"use client";

import { useParams } from "next/navigation";
import ProjectForm from "../../ProjectForm";

export default function EditProjectPage() {
    const params = useParams();
    const projectId = params.id as string;

    return <ProjectForm projectId={projectId} />;
}
