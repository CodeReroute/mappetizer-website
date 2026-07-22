import { notFound } from 'next/navigation';
import DeepLinkLanding, {
  type DeepLinkType,
} from '../../components/DeepLinkLanding/DeepLinkLanding';

const ALLOWED_TYPES = new Set<DeepLinkType>(['user', 'restaurant', 'teaser']);

type PageProps = {
  params: {
    type: string;
    id: string;
  };
};

export default function DeepLinkPage({ params }: PageProps) {
  const type = params.type as DeepLinkType;
  const id = decodeURIComponent(params.id || '').trim();

  if (!ALLOWED_TYPES.has(type) || !id) {
    notFound();
  }

  return <DeepLinkLanding type={type} id={id} />;
}
