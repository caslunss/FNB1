/** Decorative brand mark: the adjacent heading supplies the accessible name. */
export default function RaccoonMark() {
  return <picture className="page-brand-icon" aria-hidden="true">
    <source srcSet="/assets/raccoon-logo.webp" type="image/webp"/>
    <img src="/assets/raccoon-logo.png" alt="" width={200} height={183} draggable={false}/>
  </picture>;
}

