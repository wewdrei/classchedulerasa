import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileSidebar from "../components/MobileSidebar";
import Swal from "sweetalert2";

 function Profile() {
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load profile from sessionStorage
  const getProfileFromSession = () => {
    const profile = {
      id: sessionStorage.getItem("id") || "",
      firstName: sessionStorage.getItem("first_name") || "",
      middleName: sessionStorage.getItem("middle_name") || "",
      lastName: sessionStorage.getItem("last_name") || "",
      email: sessionStorage.getItem("email") || "",
      password: sessionStorage.getItem("password") || "",
      role: sessionStorage.getItem("role") || "",
      profile: sessionStorage.getItem("profile") || "",
    };
    return profile;
  };

  const [profile, setProfile] = useState(getProfileFromSession());

  useEffect(() => {
    setProfile(getProfileFromSession());
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("bg-dark");
    document.body.classList.toggle("text-white");
  };

  const toggleSidebar = () => setCollapsed(!collapsed);
  const openMobileSidebar = () => setMobileSidebarOpen(true);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const sidebarWidth = collapsed ? 80 : 250;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    let updatedProfile = { ...profile };
    let profileImage = updatedProfile.profile;

    // ✅ Only validate password if it's provided
    if (updatedProfile.password && updatedProfile.password.trim() !== "") {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

      if (!strongPasswordRegex.test(updatedProfile.password)) {
        Swal.fire(
          "Error",
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.",
          "error"
        );
        return;
      }
    } else {
      // ✅ If empty, remove password from update payload
      delete updatedProfile.password;
    }

    // ✅ Handle profile image upload
    if (profileImage && profileImage.startsWith("data:")) {
      const fd = new FormData();
      const res = await fetch(profileImage);
      const blob = await res.blob();
      fd.append("file", blob, "profile.png");
      const uploadRes = await fetch(process.env.REACT_APP_API_URL + "upload", {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success && uploadData.paths && uploadData.paths.file) {
        profileImage = uploadData.paths.file;
      }
    }

    // ✅ Build data object dynamically
    const updateData = {
      first_name: updatedProfile.firstName,
      middle_name: updatedProfile.middleName,
      last_name: updatedProfile.lastName,
      email: updatedProfile.email,
      role: updatedProfile.role,
      profile: profileImage,
    };

    if (updatedProfile.password) {
      updateData.password = updatedProfile.password;
    }

    // ✅ Send update request
    const response = await fetch(process.env.REACT_APP_API_URL + "update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        table: "users",
        where: { id: profile.id },
        data: updateData,
      }),
    });

    const result = await response.json();
    if (result.success) {
      sessionStorage.setItem("profile", profileImage || "");
      Swal.fire("Success", "Profile updated!", "success");
    } else {
      Swal.fire("Error", result.message || "Failed to update profile.", "error");
    }
  } catch (error) {
    Swal.fire("Error", "Failed to update profile.", "error");
  }
};




  return (
    <div className={`d-flex min-vh-100 ${darkMode ? "bg-dark text-white" : "bg-light"} overflow-hidden`}>
      <Sidebar collapsed={collapsed} />

      <div
        className="d-flex flex-column flex-grow-1"
        style={{
          marginLeft: window.innerWidth >= 768 ? sidebarWidth : 0,
          transition: "margin-left 0.3s",
          minWidth: 0,
        }}
      >
        <Navbar
          user={profile.firstName}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          toggleSidebar={toggleSidebar}
          openMobileSidebar={openMobileSidebar}
        />

        <div className="flex-grow-1 p-4 d-flex flex-column align-items-center">
          <form className="card p-4 col-12" style={{ maxWidth: 500 }} onSubmit={handleSubmit}>
            <div className="mb-3 d-flex justify-content-center">
              <img
                src={
                  profile.profile && !profile.profile.startsWith("data:")
                    ? process.env.REACT_APP_API_URL +
                      "../" +
                      (profile.profile.startsWith("/") ? profile.profile.replace(/^\//, "") : profile.profile)
                    : profile.profile || "https://via.placeholder.com/120"
                }
                alt="Profile"
                className="rounded-circle mb-2"
                style={{ width: 120, height: 120, objectFit: "cover" }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label"><strong>First Name</strong></label>
              <input
                type="text"
                className="form-control"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label"><strong>Middle Name</strong></label>
              <input
                type="text"
                className="form-control"
                name="middleName"
                value={profile.middleName}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label"><strong>Last Name</strong></label>
              <input
                type="text"
                className="form-control"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label"><strong>Email</strong></label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={profile.email}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label"><strong>Password</strong></label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={profile.password}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3 text-center">
              <input
                type="file"
                accept="image/*"
                className="form-control mt-2"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProfile(prev => ({
                        ...prev,
                        profile: reader.result,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label"><strong>Role</strong></label>
              <input
                type="text"
                className="form-control"
                name="role"
                value={profile.role}
                onChange={handleChange}
                disabled
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">Update Profile</button>
          </form>
        </div>

        <Footer darkMode={darkMode} />
      </div>

      <MobileSidebar open={mobileSidebarOpen} onClose={closeMobileSidebar} />
    </div>
  );
}

export default Profile; 