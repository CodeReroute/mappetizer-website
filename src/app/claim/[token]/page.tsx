import ClaimInvite from './ClaimInvite';

type ClaimPageProps = {
  params: { token: string };
};

export default function ClaimPage({ params }: ClaimPageProps) {
  const token = decodeURIComponent(params.token || '').trim();
  return <ClaimInvite token={token} />;
}
