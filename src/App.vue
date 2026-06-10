<template>
  <RouterView />
  <GlobalBridgeDialogHost />
  <GlobalBridgePanelHost />
  <Teleport to="body">
    <GlobalMessageTodoNotice />
  </Teleport>
  <Teleport to="body">
    <GlobalCustomerServiceChat />
  </Teleport>
</template>
