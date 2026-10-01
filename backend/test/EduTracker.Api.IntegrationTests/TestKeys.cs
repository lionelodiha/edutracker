namespace EduTracker.Api.IntegrationTests;

// Deterministic test-only keys, committed on purpose. They encrypt nothing
// real and must never be copied into any other environment. Real keys live
// in user-secrets / the platform secret store and never touch the repo.
internal static class TestKeys
{
    // AES-256 needs exactly 32 bytes; the HMAC key needs at least 32.
    public static string DataKeyBase64 { get; } =
        Convert.ToBase64String(Enumerable.Repeat((byte)0x2A, 32).ToArray());

    public static string HmacKeyBase64 { get; } =
        Convert.ToBase64String(Enumerable.Repeat((byte)0x42, 32).ToArray());
}
