using EduTracker.Domain.Components.Security;

namespace EduTracker.Domain.Abstractions;

/// <summary>
/// Represents an entity that contains sensitive data which can be stored
/// in encrypted form and optionally accessed in its decrypted state.
/// </summary>
/// <typeparam name="TSensitive">
/// The type of sensitive data. Must implement <see cref="ISensitiveData"/>.
/// </typeparam>
internal interface IHasSensitiveData<TSensitive>
    where TSensitive : ISensitiveData
{
    /// <summary>
    /// Gets the encrypted representation of the sensitive data.
    /// </summary>
    /// <remarks>
    /// This value should be safe for persistence in storage.
    /// </remarks>
    byte[] EncryptedData { get; }

    /// <summary>
    /// Gets the decrypted sensitive data, if it has been loaded into memory.
    /// </summary>
    /// <remarks>
    /// This value may be <c>null</c> if the data has not been decrypted
    /// or has been explicitly cleared from memory.
    /// </remarks>
    TSensitive? SensitiveData { get; }

    /// <summary>
    /// Sets the encrypted representation of the sensitive data.
    /// </summary>
    /// <param name="data">
    /// The encrypted byte array to store.
    /// </param>
    void SetEncryptedData(byte[] data);

    /// <summary>
    /// Sets the decrypted sensitive data in memory.
    /// </summary>
    /// <param name="data">
    /// The decrypted sensitive data instance.
    /// </param>
    /// <remarks>
    /// Implementations may encrypt the data and update
    /// <see cref="EncryptedData"/> accordingly.
    /// </remarks>
    void SetSensitiveData(TSensitive data);

    /// <summary>
    /// Clears the decrypted sensitive data from memory.
    /// </summary>
    /// <remarks>
    /// This should remove any in-memory representation of the sensitive data
    /// while keeping the encrypted form intact.
    /// </remarks>
    void ClearSensitiveData();
}
