import StudentDetailPage from '@/modules/monitoring/pages/StudentDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetailPage studentId={id} />;
}
