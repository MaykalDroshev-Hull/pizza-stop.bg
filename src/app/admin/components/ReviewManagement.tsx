import { Star, ExternalLink, Globe } from "lucide-react";

interface Review {
  id: string;
  initials: string;
  name: string;
  rating: number;
  timeAgo: string;
}

interface ReviewSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  reviews: Review[];
  externalLink?: string;
}

const ReviewManagement = (): React.JSX.Element => {
  const reviewSections: ReviewSection[] = [
    {
      id: "google",
      title: "From Google",
      icon: ExternalLink,
      iconBgColor: "bg-blue-600/20",
      iconColor: "text-blue-400",
      buttonColor: "bg-blue-600",
      buttonHoverColor: "hover:bg-blue-700",
      externalLink: "https://google.com/reviews",
      reviews: [
        { id: "1", initials: "JD", name: "John Doe", rating: 4, timeAgo: "2 days ago" },
        { id: "2", initials: "JS", name: "Jane Smith", rating: 5, timeAgo: "1 week ago" }
      ]
    },
    {
      id: "website",
      title: "From the Website",
      icon: Globe,
      iconBgColor: "bg-green-600/20",
      iconColor: "text-green-400",
      buttonColor: "bg-green-600",
      buttonHoverColor: "hover:bg-green-700",
      reviews: [
        { id: "3", initials: "MJ", name: "Mike Johnson", rating: 4, timeAgo: "3 days ago" },
        { id: "4", initials: "SB", name: "Sarah Brown", rating: 5, timeAgo: "5 days ago" }
      ]
    }
  ];

  const renderStars = (rating: number): React.JSX.Element[] => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
      />
    ));
  };

  const renderReviewCard = (review: Review): React.JSX.Element => (
    <div key={review.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">{review.initials}</span>
        </div>
        <div>
          <p className="text-white font-medium">{review.name}</p>
          <div className="flex items-center space-x-1">
            {renderStars(review.rating)}
          </div>
        </div>
      </div>
      <span className="text-gray-400 text-sm">{review.timeAgo}</span>
    </div>
  );

  const renderReviewSection = (section: ReviewSection): React.JSX.Element => {
    const Icon = section.icon;
    return (
      <div key={section.id} className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${section.iconBgColor} rounded-xl`}>
              <Icon className={`w-5 h-5 ${section.iconColor}`} />
            </div>
            <h3 className="text-xl font-bold text-white">{section.title}</h3>
          </div>
          {section.externalLink ? (
            <a 
              href={section.externalLink}
              target="_blank" 
              rel="noopener noreferrer"
              className={`${section.buttonColor} ${section.buttonHoverColor} text-white px-4 py-2 rounded-2xl transition-colors flex items-center space-x-2`}
            >
              <span>View All</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button className={`${section.buttonColor} ${section.buttonHoverColor} text-white px-4 py-2 rounded-2xl transition-colors`}>
              View All
            </button>
          )}
        </div>
        <div className="space-y-4">
          {section.reviews.map(renderReviewCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white mb-6">Review Management</h2>
      {reviewSections.map(renderReviewSection)}
    </div>
  );
};

export default ReviewManagement;
