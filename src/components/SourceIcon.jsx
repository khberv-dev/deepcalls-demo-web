import { Camera, Globe, Mail, MessageCircle, Phone, Send, Tag, ThumbsUp, Users, Video } from 'lucide-react'

// `icon` is a free string from the API: an icon name or a URL. Brand icons aren't available in lucide,
// so brands map to generic shapes.
const ICONS = {
    phone: Phone,
    instagram: Camera,
    telegram: Send,
    globe: Globe,
    website: Globe,
    users: Users,
    referral: Users,
    facebook: ThumbsUp,
    youtube: Video,
    mail: Mail,
    email: Mail,
    whatsapp: MessageCircle,
}

export default function SourceIcon({ icon, size = 16 }) {
    if (icon && /^https?:\/\//.test(icon)) {
        return <img className="source-icon-img" src={icon} alt="" width={size} height={size} />
    }
    const Icon = ICONS[icon?.toLowerCase()] ?? Tag
    return <Icon size={size} aria-hidden="true" />
}
