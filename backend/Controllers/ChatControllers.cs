using App.Data;
using App.Data.Entities;
using App.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/rooms/{room}")]
public class ChatController : ControllerBase
{
    private readonly ChatService _chatService;
    private readonly ChatDbContext _db;

    public ChatController(ChatService chatService, ChatDbContext db)
    {
        _chatService = chatService;
        _db = db;
    }

    // GET api/rooms/{room}/messages
    [HttpGet("messages")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(string room)
    {
        var messages = await _chatService.GetMessagesAsync(room);
        return Ok(messages.Select(ToDto));
    }

    // GET api/rooms/{room}/messages/{id}
    [HttpGet("messages/{id:guid}")]
    public async Task<ActionResult<ChatMessageDto>> GetMessage(string room, Guid id)
    {
        var message = await _chatService.GetMessageAsync(room, id);
        return message is null ? NotFound() : Ok(ToDto(message));
    }

    // POST api/rooms/{room}/messages
    [HttpPost("messages")]
    public async Task<ActionResult<ChatMessageDto>> SendMessage(string room, [FromBody] SendMessageRequest request)
    {
        var message = await _chatService.SendMessageAsync(room, request.Username, request.Content, request.Id);
        var dto = ToDto(message);

        // Notify every member of this room with refreshed unread counts.
        var memberNames = await _db.ChatRoomUsers
            .Where(u => u.Room.RoomName == room)
            .Select(u => u.Username)
            .ToListAsync();

        foreach (var member in memberNames)
        {
            await _chatService.NotifyUserCountsAsync(member);
        }

        return CreatedAtAction(
            nameof(GetMessage),
            new { room, id = message.Id },
            dto);
    }

    // POST api/rooms/{room}/read
    [HttpPost("read")]
    public async Task<IActionResult> MarkRead(string room, [FromBody] MarkReadRequest request)
    {
        var marked = await _chatService.MarkRoomAsReadAsync(room, request.Username);
        if (!marked)
        {
            return NotFound(new { status = "not_a_member" });
        }

        await _chatService.NotifyUserCountsAsync(request.Username);
        return Ok(new { status = "read" });
    }

    private static ChatMessageDto ToDto(ChatMessage message) => new(
        message.Id,
        message.RoomId,
        message.Username,
        message.Content,
        message.Timestamp);
}

public record SendMessageRequest(string Username, string Content, Guid? Id = null);

public record MarkReadRequest(string Username);

public record ChatMessageDto(Guid Id, int RoomId, string Username, string Content, DateTime Timestamp);
