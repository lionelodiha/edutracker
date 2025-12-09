namespace EduTracker.Interfaces.Services;

public interface IHashingService
{
	string HashPassword(string password);
	bool VerifyPassword(string password, string hashedPassword);

	string HashEmail(string email);
	bool VerifyEmail(string email, string hashedEmail);
}
