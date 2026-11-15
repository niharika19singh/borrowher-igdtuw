import { Routes, Route } from 'react-router-dom';
import { HomePage } from './features/marketplace/HomePage';
import { MarketplacePage } from './features/marketplace/MarketplacePage';
import { ItemDetailPage } from './features/marketplace/ItemDetailPage';
import { CreateListingPage } from './features/listings/CreateListingPage';

/**
 * FE1 routes (Marketplace & Discovery) per architecture Section 14.
 * FE2 routes are left as minimal placeholders so nav links do not 404;
 * they must not implement FE2 UI or business logic.
 */
function App() {
  return (
    <Routes>
      {/* FE1 */}
      <Route path="/" element={<HomePage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/items/:listingId" element={<ItemDetailPage />} />
      <Route path="/listings/new" element={<CreateListingPage />} />
      <Route path="/listings/:id/edit" element={<CreateListingPage />} />

      {/* FE2 route stubs — navigation only; FE2 owns implementation */}
      <Route
        path="/emergency"
        element={
          <div className="min-h-screen bg-[#faf7f5] flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <h1 className="font-serif text-2xl font-semibold text-[#2d1f24]">Emergency Essentials</h1>
              <p className="text-[#6b4f57] mt-2 text-sm">
                This board is owned by Frontend Developer 2. Navigation entry is preserved per architecture.
              </p>
              <a href="/" className="inline-block mt-4 text-[#c45a7c] text-sm underline">
                Return home
              </a>
            </div>
          </div>
        }
      />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
