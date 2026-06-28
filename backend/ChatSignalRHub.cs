using App.Services;
using Microsoft.AspNetCore.SignalR;

namespace App;

public class ChatSignalRHub : Hub
{
    private readonly ChatService _chatService;

    public ChatSignalRHub(ChatService chatService)
    {
        _chatService = chatService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.GetHttpContext()?.Request.Query["userId"].ToString();
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
            // Push the initial set of unread counts to the freshly connected client.
            await _chatService.NotifyUserCountsAsync(userId);
        }
        await base.OnConnectedAsync();
    }
}
