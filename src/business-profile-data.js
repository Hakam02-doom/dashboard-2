// Business Profile facts transcribed from the supplied September 18 recording
// and the previously captured Uplift AI Business Profile source.
export const businessProfileSeed = {
  name: 'LunchLink', type: 'Corporate Catering', website: 'https://lunchlink.ca/', email: 'info@lunchlink.ca', phone: '(437) 476-4764',
  about: 'LunchLink is a Toronto-based corporate catering service that delivers chef-inspired meals for office lunches, meetings, and events across the GTA. The company curates globally inspired menus—Mexican, Mediterranean, Greek, and healthy salad options—and offers flexible service formats including individually packaged meals and buffet-style spreads. With a focus on workplace wellness and culture, LunchLink combines premium ingredients, professional presentation, and inclusive dietary accommodations so every team member can eat confidently and safely.',
  address: 'Unit #23 120 Woodstream Blvd', city: 'Woodbridge', province: 'ON L4L 7Z1', country: 'Canada', area: 'Regional', locations: 'Toronto, GTA',
  audience: 'Corporate offices and organizations across Toronto and the GTA that host regular lunches, meetings, and events. Key buyers and stakeholders include office managers, executive assistants, HR/People Ops, operations teams, and event planners who need dependable, well-presented meals for groups of 10–500+. Audiences often require inclusive options (halal, vegan, gluten-free, nut-free, dairy-free), transparent labeling, easy ordering and invoicing, and the flexibility to adjust headcount and budget on short notice. Industries served include finance, healthcare, education, and professional services.',
  tone: 'Professional', contentTypes: 'guides, reviews, news, tutorials, case studies, how to', frequency: 'Daily', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], examples: '', locale: 'en-US',
  authorName: '', jobTitle: '', bio: '', expertise: '', socialLinks: '', authorImage: '', logo: '',
  keywords: ["corporate catering Toronto", "office lunch delivery Toronto", "office catering Toronto", "breakfast catering Toronto", "buffet catering Toronto", "boxed lunches Toronto", "halal corporate catering Toronto", "same-day corporate catering Toronto", "recurring office meal programs Toronto", "corporate catering GTA", "Mexican catering Toronto", "Mediterranean catering Toronto", "Greek catering Toronto", "healthy salad catering Toronto", "vegan office catering Toronto", "gluten-free catering Toronto", "nut-free catering Toronto", "dairy-free catering Toronto", "pescatarian catering Toronto", "individually packaged meals Toronto", "labeled meals catering Toronto", "group catering services Toronto", "conference catering Toronto", "client meeting catering Toronto", "office party catering Toronto", "budget-friendly catering Toronto", "professional catering presentation", "corporate invoicing catering", "Toronto caterers"].map((text,i)=>({id:`source-${i}`,text,priority:i<10?'Must Have':'Nice to Have'})),
  advantages: [
    'Chef-curated, globally inspired menus tailored for corporate environments',
    'Inclusive dietary accommodation with fully labeled meals (halal, vegan, gluten-free, nut-free, etc.)',
    'Reliable, on-time delivery with capability for last-minute and same-day orders',
    'Flexible service formats: individually packed meals or buffet-style with no setup required',
    'Recurring office meal programs with rotating menus, one invoice, and volume pricing from $12/person',
    'Professional presentation and consistent quality through vetted Toronto partners',
    'Corporate-friendly operations including one point of contact and corporate invoicing',
    'Commitment to freshness: never-frozen meats and locally sourced ingredients',
    'Forward-looking technology with an upcoming app for individual ordering, live tracking, and admin dashboards',
  ], competitors: [{"name": "Foodee", "url": "https://www.food.ee/"}, {"name": "Thriver", "url": "https://www.thriver.com/"}, {"name": "ezCater (Toronto)", "url": "https://www.ezcater.com/catering/ca/toronto"}, {"name": "Rose Reisman Catering", "url": "https://www.rosereismancatering.com/"}, {"name": "10tation Event Catering", "url": "https://www.10tation.com/"}], images: [], favicon: '', linkedin: '', twitter: '', facebook: '', authorWebsite: '',
};
export const brandColors = ['#075636','#D7D5A6','#7CAA9C','#C4D0CA','#114B32','#7C9C94','#E7BC72','#9C431B'];
