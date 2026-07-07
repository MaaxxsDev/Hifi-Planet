import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import SetupGate from './components/SetupGate.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RequirePermission from './components/RequirePermission.jsx';

import Home from './pages/public/Home.jsx';
import VehicleSelect from './pages/public/VehicleSelect.jsx';
import BrandPage from './pages/public/BrandPage.jsx';
import ModelPage from './pages/public/ModelPage.jsx';
import GalleryOverview from './pages/public/GalleryOverview.jsx';
import GalleryBrandPage from './pages/public/GalleryBrandPage.jsx';
import GalleryProjectPage from './pages/public/GalleryProjectPage.jsx';
import Leistungen from './pages/public/Leistungen.jsx';
import ContactPage from './pages/public/ContactPage.jsx';
import Impressum from './pages/public/Impressum.jsx';
import Datenschutz from './pages/public/Datenschutz.jsx';
import AGB from './pages/public/AGB.jsx';
import SetupWizard from './pages/public/SetupWizard.jsx';

import Login from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Brands from './pages/admin/Brands.jsx';
import Models from './pages/admin/Models.jsx';
import GalleryBrands from './pages/admin/GalleryBrands.jsx';
import GalleryProjects from './pages/admin/GalleryProjects.jsx';
import GalleryPhotos from './pages/admin/GalleryPhotos.jsx';
import Packages from './pages/admin/Packages.jsx';
import Services from './pages/admin/Services.jsx';
import Faqs from './pages/admin/Faqs.jsx';
import PackageProducts from './pages/admin/PackageProducts.jsx';
import PackageUpgrades from './pages/admin/PackageUpgrades.jsx';
import ContactRequests from './pages/admin/ContactRequests.jsx';
import AccountSettings from './pages/admin/AccountSettings.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import PermissionGroups from './pages/admin/PermissionGroups.jsx';
import SettingsLayout from './pages/admin/settings/SettingsLayout.jsx';
import WebsiteSettings from './pages/admin/settings/WebsiteSettings.jsx';
import EmailSettings from './pages/admin/settings/EmailSettings.jsx';
import DatabaseSettings from './pages/admin/settings/DatabaseSettings.jsx';
import ExportImportSettings from './pages/admin/settings/ExportImportSettings.jsx';
import MaintenanceSettings from './pages/admin/settings/MaintenanceSettings.jsx';
import ResetSettings from './pages/admin/settings/ResetSettings.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <SetupGate>
      <Routes>
      <Route path="/setup" element={<SetupWizard />} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/fahrzeuge" element={<VehicleSelect />} />
        <Route path="/fahrzeuge/:brandSlug" element={<BrandPage />} />
        <Route path="/fahrzeuge/:brandSlug/:modelSlug" element={<ModelPage />} />
        <Route path="/galerie" element={<GalleryOverview />} />
        <Route path="/galerie/:brandSlug" element={<GalleryBrandPage />} />
        <Route path="/galerie/:brandSlug/:projectSlug" element={<GalleryProjectPage />} />
        <Route path="/leistungen" element={<Leistungen />} />
        <Route path="/kontakt" element={<ContactPage />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/agb" element={<AGB />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />

      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="brands" element={<RequirePermission permission="brands.manage"><Brands /></RequirePermission>} />
          <Route path="models" element={<RequirePermission permission="models.manage"><Models /></RequirePermission>} />
          <Route path="gallery-brands" element={<RequirePermission permission="gallery.manage"><GalleryBrands /></RequirePermission>} />
          <Route path="gallery-projects" element={<RequirePermission permission="gallery.manage"><GalleryProjects /></RequirePermission>} />
          <Route path="gallery-projects/:projectId/photos" element={<RequirePermission permission="gallery.manage"><GalleryPhotos /></RequirePermission>} />
          <Route path="packages" element={<RequirePermission permission="packages.manage"><Packages /></RequirePermission>} />
          <Route path="packages/:packageId/products" element={<RequirePermission permission="packages.manage"><PackageProducts /></RequirePermission>} />
          <Route path="packages/:packageId/upgrades" element={<RequirePermission permission="packages.manage"><PackageUpgrades /></RequirePermission>} />
          <Route path="services" element={<RequirePermission permission="services.manage"><Services /></RequirePermission>} />
          <Route path="faqs" element={<RequirePermission permission="content.manage"><Faqs /></RequirePermission>} />
          <Route path="contact-requests" element={<RequirePermission permission="contact.manage"><ContactRequests /></RequirePermission>} />
          <Route path="users" element={<RequirePermission permission="users.manage"><AdminUsers /></RequirePermission>} />
          <Route path="permission-groups" element={<RequirePermission permission="permission_groups.manage"><PermissionGroups /></RequirePermission>} />
          <Route
            path="settings"
            element={<RequirePermission permission="settings.manage"><SettingsLayout /></RequirePermission>}
          >
            <Route index element={<Navigate to="website" replace />} />
            <Route path="website" element={<WebsiteSettings />} />
            <Route path="email" element={<EmailSettings />} />
            <Route path="database" element={<DatabaseSettings />} />
            <Route path="export-import" element={<ExportImportSettings />} />
            <Route path="maintenance" element={<MaintenanceSettings />} />
            <Route path="reset" element={<ResetSettings />} />
          </Route>
        </Route>
      </Route>
      </Routes>
      </SetupGate>
    </>
  );
}
