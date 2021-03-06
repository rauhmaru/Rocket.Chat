/* globals Department */
Template.livechatWindow.helpers({
	title() {
		return Template.instance().title.get();
	},
	color() {
		return Template.instance().color.get();
	},
	popoutActive() {
		return FlowRouter.getQueryParam('mode') === 'popout';
	},
	showRegisterForm() {
		if (Session.get('triggered') || Meteor.userId()) {
			return false;
		}
		return Template.instance().registrationForm.get();
	},
	livechatStartedEnabled() {
		return Template.instance().enabled.get() !== null;
	},
	livechatEnabled() {
		return Template.instance().enabled.get();
	}
});

Template.livechatWindow.events({
	'click .title'() {
		parentCall('toggleWindow');
	},
	'click .popout'(event) {
		event.stopPropagation();
		parentCall('openPopout');
	}
});

Template.livechatWindow.onCreated(function() {
	this.enabled = new ReactiveVar(null);

	this.title = new ReactiveVar('Rocket.Chat');
	this.color = new ReactiveVar('#C1272D');
	this.registrationForm = new ReactiveVar(true);

	// get all needed live chat info for the user
	Meteor.call('livechat:getInitialData', visitor.getToken(), (err, result) => {
		if (err) {
			console.error(err);
		} else {
			if (!result.enabled) {
				return parentCall('removeWidget');
			}
			this.enabled.set(result.enabled);
			this.title.set(result.title);
			this.color.set(result.color);
			this.registrationForm.set(result.registrationForm);

			if (result.room) {
				RoomHistoryManager.getMoreIfIsEmpty(result.room._id);
				visitor.subscribeToRoom(result.room._id);
				visitor.setRoom(result.room._id);
			}

			Triggers.setTriggers(result.triggers);
			Triggers.init();

			result.departments.forEach((department) => {
				Department.insert(department);
			});
		}
	});
});
